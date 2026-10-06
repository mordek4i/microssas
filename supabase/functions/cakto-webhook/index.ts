import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cakto-secret, x-webhook-secret, x-secret",
};

const JSON_HEADERS = {
  ...CORS_HEADERS,
  "Content-Type": "application/json",
};

// Helper: Extrair e-mail do cliente de forma robusta e compatível com payloads Cakto
function extractCustomerEmail(data: Record<string, unknown>, payload: Record<string, unknown>): string | null {
  const customer = data.customer && typeof data.customer === "object" ? (data.customer as Record<string, unknown>) : null;
  const payloadCustomer = payload.customer && typeof payload.customer === "object" ? (payload.customer as Record<string, unknown>) : null;

  const rawCandidate =
    customer?.email ||
    data.customerEmail ||
    data.customer_email ||
    (typeof data.email === "string" ? data.email : null) ||
    payloadCustomer?.email ||
    payload.customerEmail ||
    payload.customer_email ||
    (typeof payload.email === "string" ? payload.email : null);

  if (typeof rawCandidate === "string" && rawCandidate.trim().includes("@")) {
    return rawCandidate.trim().toLowerCase();
  }
  return null;
}

// Helper: Extrair nome do cliente
function extractCustomerName(data: Record<string, unknown>, payload: Record<string, unknown>): string | null {
  const customer = data.customer && typeof data.customer === "object" ? (data.customer as Record<string, unknown>) : null;
  const payloadCustomer = payload.customer && typeof payload.customer === "object" ? (payload.customer as Record<string, unknown>) : null;

  const rawCandidate =
    customer?.name ||
    data.customerName ||
    data.customer_name ||
    (typeof data.name === "string" ? data.name : null) ||
    payloadCustomer?.name ||
    null;

  return typeof rawCandidate === "string" && rawCandidate.trim() ? rawCandidate.trim() : null;
}

// Helper: Extrair plano e ID do produto
function extractProductInfo(data: Record<string, unknown>, payload: Record<string, unknown>): { productId: string | null; plan: string } {
  const product = data.product && typeof data.product === "object" ? (data.product as Record<string, unknown>) : null;
  const offer = data.offer && typeof data.offer === "object" ? (data.offer as Record<string, unknown>) : null;
  const payloadProduct = payload.product && typeof payload.product === "object" ? (payload.product as Record<string, unknown>) : null;

  const productId =
    (product?.id ? String(product.id) : null) ||
    (offer?.id ? String(offer.id) : null) ||
    (payloadProduct?.id ? String(payloadProduct.id) : null) ||
    null;

  const productName =
    (typeof product?.name === "string" ? product.name : null) ||
    (typeof offer?.name === "string" ? offer.name : null) ||
    (typeof payloadProduct?.name === "string" ? payloadProduct.name : null) ||
    (typeof data.plan === "string" ? data.plan : null) ||
    (typeof payload.plan === "string" ? payload.plan : null);

  let plan = "ReservaZen Pro";
  if (productName) {
    const lower = productName.toLowerCase();
    if (lower.includes("anual")) {
      plan = "anual";
    } else if (lower.includes("mensal")) {
      plan = "mensal";
    } else if (lower.includes("trimestral")) {
      plan = "trimestral";
    } else if (lower.includes("semestral")) {
      plan = "semestral";
    } else {
      plan = productName;
    }
  }

  return { productId, plan };
}

Deno.serve(async (req: Request) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  // Aceitar apenas requisições POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Only POST is accepted." }),
      { status: 405, headers: JSON_HEADERS }
    );
  }

  try {
    const configuredSecret = Deno.env.get("CAKTO_WEBHOOK_SECRET");
    if (!configuredSecret) {
      return new Response(
        JSON.stringify({
          error: "Server configuration error",
          message: "CAKTO_WEBHOOK_SECRET is not configured on Supabase Edge Functions",
        }),
        { status: 500, headers: JSON_HEADERS }
      );
    }

    // 1. Obter segredo no Header
    const headerSecret =
      req.headers.get("x-cakto-secret") ||
      req.headers.get("x-webhook-secret") ||
      req.headers.get("x-secret");

    // 2. Parse do payload JSON
    let bodyText = "";
    let payload: Record<string, unknown> = {};
    try {
      bodyText = await req.text();
      if (bodyText) {
        payload = JSON.parse(bodyText);
      }
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON", message: "O corpo da requisição não é um JSON válido." }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    const payloadSecret = typeof payload.secret === "string" ? payload.secret : null;
    const incomingSecret = headerSecret || payloadSecret;

    // 3. Validação de autenticidade (segredo da Cakto)
    if (!incomingSecret || incomingSecret !== configuredSecret) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Segredo do webhook inválido ou ausente",
        }),
        { status: 401, headers: JSON_HEADERS }
      );
    }

    // Se for teste simples de webhook da Cakto ou ping
    const rawEvent = typeof payload.event === "string" ? payload.event : "";
    const event = rawEvent.trim().toLowerCase();

    if (event === "test" || event === "ping" || payload.test === true) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Webhook de teste autenticado com sucesso",
          received_at: new Date().toISOString(),
        }),
        { status: 200, headers: JSON_HEADERS }
      );
    }

    // 4. Inicializar cliente Supabase com Service Role Key
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({
          error: "Server configuration error",
          message: "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas",
        }),
        { status: 500, headers: JSON_HEADERS }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 5. Extração de dados da Cakto
    const data = (payload.data && typeof payload.data === "object" ? payload.data : payload) as Record<string, unknown>;
    const orderId = data.id != null ? String(data.id) : (payload.order_id != null ? String(payload.order_id) : (payload.id != null ? String(payload.id) : null));

    const subObj = data.subscription && typeof data.subscription === "object" ? (data.subscription as Record<string, unknown>) : null;
    const subscriptionId = subObj?.id != null ? String(subObj.id) : (data.subscription_id != null ? String(data.subscription_id) : null);

    // ID único do evento para idempotência
    const rawEventId = typeof payload.event_id === "string" ? payload.event_id : null;
    const eventId = rawEventId || (orderId ? `${event}_${orderId}` : (subscriptionId ? `${event}_${subscriptionId}` : `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`));

    // 6. Idempotência: verificar se o evento já foi processado
    const { data: existingEvent, error: existingErr } = await supabase
      .from("webhook_events")
      .select("id, processed")
      .eq("event_id", eventId)
      .maybeSingle();

    if (existingErr) {
      console.warn("Aviso ao consultar webhook_events:", existingErr.message);
    }

    if (existingEvent?.processed) {
      console.log(`[Idempotência] Evento ${eventId} já processado anteriormente.`);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Evento já processado anteriormente (idempotente)",
          event_id: eventId,
          already_processed: true,
        }),
        { status: 200, headers: JSON_HEADERS }
      );
    }

    // Registrar evento na tabela de auditoria se ainda não existir
    if (!existingEvent) {
      await supabase.from("webhook_events").insert({
        event_id: eventId,
        event_type: event,
        payload: payload,
        processed: false,
      });
    }

    // 7. Extrair dados do cliente
    const customerEmail = extractCustomerEmail(data, payload);
    const customerName = extractCustomerName(data, payload);
    const { productId, plan } = extractProductInfo(data, payload);

    const startedAt =
      (typeof data.createdAt === "string" ? data.createdAt : null) ||
      (typeof data.created_at === "string" ? data.created_at : null) ||
      new Date().toISOString();

    // 8. Processamento por tipo de evento
    let processedStatus = "ignored";
    let targetUserId: string | null = null;

    if (
      event === "purchase_approved" ||
      event === "payment_approved" ||
      event === "subscription_renewed"
    ) {
      if (!customerEmail) {
        return new Response(
          JSON.stringify({
            error: "Bad Request",
            message: "E-mail do cliente não encontrado no payload da Cakto",
            event_id: eventId,
          }),
          { status: 400, headers: JSON_HEADERS }
        );
      }

      // Localizar o usuário pelo e-mail
      // 1º tentativa: tabela profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, user_id, email, nome")
        .ilike("email", customerEmail)
        .maybeSingle();

      if (profile?.user_id) {
        targetUserId = profile.user_id;
      } else {
        // 2º tentativa: auth.users
        try {
          const { data: userData } = await supabase.auth.admin.listUsers();
          const matchedAuthUser = userData?.users?.find(
            (u) => u.email?.toLowerCase() === customerEmail.toLowerCase()
          );

          if (matchedAuthUser) {
            targetUserId = matchedAuthUser.id;
            // Sincronizar registro em profiles se ainda não existir
            await supabase.from("profiles").upsert(
              {
                user_id: matchedAuthUser.id,
                email: matchedAuthUser.email,
                nome: customerName || matchedAuthUser.user_metadata?.nome || matchedAuthUser.user_metadata?.name || customerEmail.split("@")[0],
              },
              { onConflict: "user_id" }
            );
          }
        } catch (authErr) {
          console.warn("Aviso ao buscar auth.users:", authErr);
        }
      }

      // Se o usuário não existir no sistema
      if (!targetUserId) {
        console.warn(`[Cakto Webhook] Usuário com e-mail ${customerEmail} não encontrado no sistema.`);
        return new Response(
          JSON.stringify({
            success: false,
            error: "User not found",
            message: `Nenhum usuário cadastrado com o e-mail: ${customerEmail}`,
            email: customerEmail,
            event_id: eventId,
          }),
          { status: 404, headers: JSON_HEADERS }
        );
      }

      // Localizar business_id associado ao usuário
      let businessId: number | null = null;
      const { data: business } = await supabase
        .from("businesses")
        .select("id")
        .eq("owner_id", targetUserId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (business?.id) {
        businessId = business.id;
      }

      // Calcular data de expiração
      let expiresAt: string | null = null;
      if (typeof subObj?.next_billing_date === "string") {
        expiresAt = subObj.next_billing_date;
      } else if (typeof subObj?.next_payment_date === "string") {
        expiresAt = subObj.next_payment_date;
      } else {
        const isAnnual = plan.toLowerCase().includes("anual");
        const expDate = new Date(startedAt);
        expDate.setDate(expDate.getDate() + (isAnnual ? 365 : 30));
        expiresAt = expDate.toISOString();
      }

      // Localizar assinatura existente para atualizar ou criar nova
      let existingSubId: string | null = null;
      if (subscriptionId) {
        const { data: subById } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("cakto_subscription_id", subscriptionId)
          .maybeSingle();
        if (subById?.id) existingSubId = subById.id;
      }

      if (!existingSubId && orderId) {
        const { data: subByOrder } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("cakto_order_id", orderId)
          .maybeSingle();
        if (subByOrder?.id) existingSubId = subByOrder.id;
      }

      if (!existingSubId) {
        const { data: subByUser } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("user_id", targetUserId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (subByUser?.id) existingSubId = subByUser.id;
      }

      if (existingSubId) {
        const { error: updateErr } = await supabase
          .from("subscriptions")
          .update({
            business_id: businessId,
            plan: plan,
            status: "active",
            cakto_product_id: productId,
            cakto_order_id: orderId,
            cakto_subscription_id: subscriptionId,
            started_at: startedAt,
            expires_at: expiresAt,
            canceled_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSubId);

        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from("subscriptions")
          .insert({
            user_id: targetUserId,
            business_id: businessId,
            plan: plan,
            status: "active",
            cakto_product_id: productId,
            cakto_order_id: orderId,
            cakto_subscription_id: subscriptionId,
            started_at: startedAt,
            expires_at: expiresAt,
            canceled_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertErr) throw insertErr;
      }

      processedStatus = "active";
    } else if (
      event === "subscription_canceled" ||
      event === "subscription_cancelled"
    ) {
      // Localizar assinatura por subscriptionId, orderId ou e-mail
      let subQuery = supabase.from("subscriptions").select("id, user_id");

      if (subscriptionId) {
        subQuery = subQuery.eq("cakto_subscription_id", subscriptionId);
      } else if (orderId) {
        subQuery = subQuery.eq("cakto_order_id", orderId);
      } else if (customerEmail) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id")
          .ilike("email", customerEmail)
          .maybeSingle();
        if (profile?.user_id) {
          subQuery = subQuery.eq("user_id", profile.user_id);
        }
      }

      const { data: subToCancel } = await subQuery.limit(1).maybeSingle();

      if (subToCancel?.id) {
        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", subToCancel.id);
        processedStatus = "canceled";
        targetUserId = subToCancel.user_id;
      }
    } else if (
      event === "refund" ||
      event === "purchase_refunded"
    ) {
      let subQuery = supabase.from("subscriptions").select("id, user_id");

      if (orderId) {
        subQuery = subQuery.eq("cakto_order_id", orderId);
      } else if (subscriptionId) {
        subQuery = subQuery.eq("cakto_subscription_id", subscriptionId);
      } else if (customerEmail) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id")
          .ilike("email", customerEmail)
          .maybeSingle();
        if (profile?.user_id) {
          subQuery = subQuery.eq("user_id", profile.user_id);
        }
      }

      const { data: subToRefund } = await subQuery.limit(1).maybeSingle();

      if (subToRefund?.id) {
        await supabase
          .from("subscriptions")
          .update({
            status: "refunded",
            updated_at: new Date().toISOString(),
          })
          .eq("id", subToRefund.id);
        processedStatus = "refunded";
        targetUserId = subToRefund.user_id;
      }
    } else if (
      event === "chargeback" ||
      event === "purchase_chargeback"
    ) {
      let subQuery = supabase.from("subscriptions").select("id, user_id");

      if (orderId) {
        subQuery = subQuery.eq("cakto_order_id", orderId);
      } else if (subscriptionId) {
        subQuery = subQuery.eq("cakto_subscription_id", subscriptionId);
      } else if (customerEmail) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("user_id")
          .ilike("email", customerEmail)
          .maybeSingle();
        if (profile?.user_id) {
          subQuery = subQuery.eq("user_id", profile.user_id);
        }
      }

      const { data: subToChargeback } = await subQuery.limit(1).maybeSingle();

      if (subToChargeback?.id) {
        await supabase
          .from("subscriptions")
          .update({
            status: "chargeback",
            updated_at: new Date().toISOString(),
          })
          .eq("id", subToChargeback.id);
        processedStatus = "chargeback";
        targetUserId = subToChargeback.user_id;
      }
    } else {
      console.log(`[Cakto Webhook] Evento não mapeado diretamente: ${event}. Registrado no log.`);
    }

    // 9. Atualizar webhook_events como processado
    await supabase
      .from("webhook_events")
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
      })
      .eq("event_id", eventId);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Evento '${event}' processado com sucesso`,
        event_id: eventId,
        user_id: targetUserId,
        status: processedStatus,
        received_at: new Date().toISOString(),
      }),
      { status: 200, headers: JSON_HEADERS }
    );
  } catch (err) {
    console.error("Erro interno no webhook:", err);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: err instanceof Error ? err.message : "Erro desconhecido",
      }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
});
