import crypto from 'node:crypto';
import {
  findUserByEmail,
  createUser,
  getSubscriptionByUserId,
  createSubscription,
  updateSubscription,
  findProcessedWebhookEvent,
  saveWebhookEvent
} from './db.js';

export interface CaktoWebhookPayload {
  secret?: string;
  event: string;
  event_id?: string;
  data: {
    id?: string | number;
    status?: string;
    createdAt?: string;
    amount?: number;
    offer?: {
      id?: string;
      name?: string;
      price?: number;
    };
    customer?: {
      id?: string | number;
      name?: string;
      email?: string;
      phone?: string;
      docNumber?: string;
    };
    // Direct fields present in some event types
    customerEmail?: string;
    customerName?: string;
    customerCellphone?: string;
    product?: {
      id?: string;
      name?: string;
      type?: string;
      short_id?: string;
      supportEmail?: string;
    };
    subscription?: {
      id?: string;
      status?: string;
      next_billing_date?: string;
    };
    [key: string]: unknown;
  };
}

export interface WebhookProcessResult {
  success: boolean;
  statusCode: number;
  message: string;
  eventId?: string;
  eventType?: string;
  userEmail?: string;
  alreadyProcessed?: boolean;
}

/**
 * Validates the secret from the incoming webhook against the server environment variable.
 */
export function validateCaktoSecret(incomingSecret: string | undefined): boolean {
  const expectedSecret = process.env.CAKTO_WEBHOOK_SECRET;
  if (!expectedSecret) {
    console.warn('⚠️ [Cakto Webhook] CAKTO_WEBHOOK_SECRET is not configured in environment!');
    return false;
  }
  return incomingSecret === expectedSecret;
}

/**
 * Main processor for Cakto Webhooks with strict idempotency and audit trail.
 */
export function processCaktoWebhook(payload: CaktoWebhookPayload): WebhookProcessResult {
  const event = payload.event;
  const data = payload.data || {};

  // Extract customer info (flexible for different Cakto event schemas)
  const customerEmail = (
    data.customer?.email ||
    data.customerEmail ||
    (typeof data.email === 'string' ? data.email : '')
  )?.trim().toLowerCase();

  const customerName = (
    data.customer?.name ||
    data.customerName ||
    (typeof data.name === 'string' ? data.name : '') ||
    'Cliente ReservaZen'
  )?.trim();

  // Extract order/event identifiers
  const orderId = data.id ? String(data.id) : null;
  const subscriptionId = data.subscription?.id ? String(data.subscription.id) : (orderId || null);
  const productId = data.product?.id ? String(data.product.id) : null;
  const productName = data.product?.name || data.offer?.name || 'Plano ReservaZen';
  const amount = Number(data.amount || data.offer?.price || 0);

  // Generate deterministic event identifier for idempotence
  const eventUniqueId = payload.event_id || (orderId ? `${event}_${orderId}` : `evt_${crypto.randomUUID()}`);

  console.log(`📥 [Cakto Webhook] Recebido: [${event}] para: ${customerEmail || 'sem-email'} (ID: ${eventUniqueId})`);

  // 1. Idempotency Check
  const existingProcessedEvent = findProcessedWebhookEvent(eventUniqueId);
  if (existingProcessedEvent) {
    console.log(`ℹ️ [Cakto Webhook] Evento já processado anteriormente (${eventUniqueId}). Retornando 200 OK.`);
    return {
      success: true,
      statusCode: 200,
      message: 'Event already processed (idempotent)',
      eventId: eventUniqueId,
      eventType: event,
      alreadyProcessed: true
    };
  }

  // 2. Dispatch according to event type
  try {
    switch (event) {
      case 'purchase_approved':
        handlePurchaseApproved({
          customerEmail,
          customerName,
          orderId,
          productId,
          productName,
          subscriptionId,
          amount,
          createdAt: data.createdAt
        });
        break;

      case 'subscription_renewed':
        handleSubscriptionRenewed({
          customerEmail,
          subscriptionId,
          amount
        });
        break;

      case 'subscription_canceled':
        handleSubscriptionCanceled({
          customerEmail,
          subscriptionId
        });
        break;

      case 'refund':
        handleRefund({
          customerEmail,
          orderId,
          subscriptionId
        });
        break;

      case 'chargeback':
        handleChargeback({
          customerEmail,
          orderId,
          subscriptionId
        });
        break;

      default:
        console.log(`⚠️ [Cakto Webhook] Evento não mapeado para ação direta: ${event}. Registrado no log.`);
    }

    // 3. Save to webhook_events log as processed
    saveWebhookEvent({
      id: crypto.randomUUID(),
      event_id: eventUniqueId,
      event_type: event,
      payload: JSON.stringify(payload),
      processed: 1
    });

    return {
      success: true,
      statusCode: 200,
      message: `Webhook ${event} processed successfully`,
      eventId: eventUniqueId,
      eventType: event,
      userEmail: customerEmail
    };

  } catch (error) {
    console.error(`❌ [Cakto Webhook] Erro ao processar evento ${event}:`, error);

    // Record as failed/unprocessed for audit
    saveWebhookEvent({
      id: crypto.randomUUID(),
      event_id: eventUniqueId,
      event_type: event,
      payload: JSON.stringify(payload),
      processed: 0
    });

    return {
      success: false,
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Internal error processing webhook',
      eventId: eventUniqueId,
      eventType: event
    };
  }
}

/**
 * Handle purchase_approved
 */
function handlePurchaseApproved(params: {
  customerEmail?: string;
  customerName: string;
  orderId: string | null;
  productId: string | null;
  productName: string;
  subscriptionId: string | null;
  amount: number;
  createdAt?: string;
}) {
  if (!params.customerEmail) {
    throw new Error('E-mail do cliente não informado no payload de purchase_approved');
  }

  const now = new Date();
  const startedAt = params.createdAt || now.toISOString();

  // Next billing: 30 days ahead by default (or 365 if annual)
  const isAnnual = params.productName.toLowerCase().includes('anual');
  const expiresAtDate = new Date(now);
  expiresAtDate.setDate(expiresAtDate.getDate() + (isAnnual ? 365 : 30));
  const expiresAt = expiresAtDate.toISOString();

  let user = findUserByEmail(params.customerEmail);

  if (!user) {
    // User signed up directly on Cakto checkout without prior local registration
    console.log(`✨ [Cakto Webhook] Criando nova conta de usuário para: ${params.customerEmail}`);
    const userId = `usr_${crypto.randomUUID()}`;
    const defaultPasswordHash = crypto.createHash('sha256').update('ReservaZen2026!').digest('hex');

    user = createUser({
      id: userId,
      name: params.customerName,
      email: params.customerEmail,
      password_hash: defaultPasswordHash
    });

    createSubscription({
      id: `sub_${crypto.randomUUID()}`,
      user_id: user.id,
      status: 'active',
      plan: isAnnual ? 'anual' : 'mensal',
      amount: params.amount,
      cakto_product_id: params.productId,
      cakto_order_id: params.orderId,
      cakto_subscription_id: params.subscriptionId,
      started_at: startedAt,
      expires_at: expiresAt
    });
  } else {
    // User already exists in pending_payment or was previously inactive
    console.log(`🔄 [Cakto Webhook] Ativando assinatura do usuário existente: ${user.email}`);
    const currentSub = getSubscriptionByUserId(user.id);

    if (currentSub) {
      updateSubscription(user.id, {
        status: 'active',
        plan: isAnnual ? 'anual' : 'mensal',
        cakto_product_id: params.productId,
        cakto_order_id: params.orderId,
        cakto_subscription_id: params.subscriptionId,
        amount: params.amount,
        started_at: startedAt,
        expires_at: expiresAt,
        canceled_at: null
      });
    } else {
      createSubscription({
        id: `sub_${crypto.randomUUID()}`,
        user_id: user.id,
        status: 'active',
        plan: isAnnual ? 'anual' : 'mensal',
        amount: params.amount,
        cakto_product_id: params.productId,
        cakto_order_id: params.orderId,
        cakto_subscription_id: params.subscriptionId,
        started_at: startedAt,
        expires_at: expiresAt
      });
    }
  }

  console.log(`✅ [Cakto Webhook] Assinatura ATIVA liberada para ${params.customerEmail}`);
}

/**
 * Handle subscription_renewed
 */
function handleSubscriptionRenewed(params: {
  customerEmail?: string;
  subscriptionId: string | null;
  amount: number;
}) {
  if (!params.customerEmail) return;

  const user = findUserByEmail(params.customerEmail);
  if (!user) {
    console.warn(`⚠️ [Cakto Webhook] Renovação recebida para usuário inexistente: ${params.customerEmail}`);
    return;
  }

  const currentSub = getSubscriptionByUserId(user.id);
  const now = new Date();
  const nextBilling = new Date(currentSub?.expires_at ? new Date(currentSub.expires_at) : now);
  nextBilling.setDate(nextBilling.getDate() + 30);

  updateSubscription(user.id, {
    status: 'active',
    amount: params.amount > 0 ? params.amount : currentSub?.amount,
    expires_at: nextBilling.toISOString(),
    canceled_at: null
  });

  console.log(`✅ [Cakto Webhook] Assinatura renovada até ${nextBilling.toISOString()} para ${params.customerEmail}`);
}

/**
 * Handle subscription_canceled
 */
function handleSubscriptionCanceled(params: {
  customerEmail?: string;
  subscriptionId: string | null;
}) {
  if (!params.customerEmail) return;

  const user = findUserByEmail(params.customerEmail);
  if (!user) return;

  updateSubscription(user.id, {
    status: 'canceled',
    canceled_at: new Date().toISOString()
  });

  console.log(`⚠️ [Cakto Webhook] Assinatura cancelada para ${params.customerEmail}. Dados preservados.`);
}

/**
 * Handle refund
 */
function handleRefund(params: {
  customerEmail?: string;
  orderId: string | null;
  subscriptionId: string | null;
}) {
  if (!params.customerEmail) return;

  const user = findUserByEmail(params.customerEmail);
  if (!user) return;

  updateSubscription(user.id, {
    status: 'refunded',
    canceled_at: new Date().toISOString()
  });

  console.log(`⛔ [Cakto Webhook] Reembolso processado para ${params.customerEmail}. Acesso pago suspenso.`);
}

/**
 * Handle chargeback
 */
function handleChargeback(params: {
  customerEmail?: string;
  orderId: string | null;
  subscriptionId: string | null;
}) {
  if (!params.customerEmail) return;

  const user = findUserByEmail(params.customerEmail);
  if (!user) return;

  updateSubscription(user.id, {
    status: 'chargeback',
    canceled_at: new Date().toISOString()
  });

  console.log(`🚨 [Cakto Webhook] Chargeback detectado para ${params.customerEmail}. Acesso suspenso.`);
}
