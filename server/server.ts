import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'node:crypto';
import {
  initDatabase,
  findUserByEmail,
  createUser,
  getSubscriptionByUserId,
  createSubscription,
  updateSubscription,
  listWebhookEvents
} from './db.js';
import {
  validateCaktoSecret,
  processCaktoWebhook,
  CaktoWebhookPayload
} from './caktoService.js';

// Load environment variables from .env
dotenv.config();

// Initialize SQLite database
initDatabase();

const app = express();
const PORT = Number(process.env.PORT || 3001);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (req.path.startsWith('/api')) {
      const duration = Date.now() - start;
      console.log(`[HTTP] ${req.method} ${req.path} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Helper: Hash password
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// -------------------------------------------------------------
// 1. OFFICIAL CAKTO WEBHOOK ENDPOINT
// -------------------------------------------------------------
app.post('/api/webhooks/cakto', (req: Request, res: Response) => {
  const payload = req.body as CaktoWebhookPayload;

  // 1.1 Secret Validation (Security)
  const isSecretValid = validateCaktoSecret(payload?.secret);
  if (!isSecretValid) {
    console.warn('⛔ [Cakto Webhook] Requisição rejeitada: Secret inválido ou ausente.');
    return res.status(401).json({
      error: 'Não autorizado: Chave secreta (secret) inválida ou não configurada.'
    });
  }

  // 1.2 Process Webhook Event with Idempotence
  const result = processCaktoWebhook(payload);

  // 1.3 Fast HTTP 200 response to Cakto
  return res.status(result.statusCode).json({
    received: true,
    result
  });
});

// -------------------------------------------------------------
// 2. DEV SIMULATOR ENDPOINT (For testing webhooks without real money)
// -------------------------------------------------------------
app.post('/api/webhooks/simulate', (req: Request, res: Response) => {
  const payload = req.body as CaktoWebhookPayload;

  if (!payload || !payload.event) {
    return res.status(400).json({ error: 'Payload ou evento ausente.' });
  }

  // Use configured secret if none provided in test
  if (!payload.secret && process.env.CAKTO_WEBHOOK_SECRET) {
    payload.secret = process.env.CAKTO_WEBHOOK_SECRET;
  }

  const result = processCaktoWebhook(payload);
  return res.status(result.statusCode).json(result);
});

// -------------------------------------------------------------
// 3. WEBHOOK AUDIT LOGS (For dashboard & settings inspect)
// -------------------------------------------------------------
app.get('/api/webhooks/logs', (_req: Request, res: Response) => {
  try {
    const logs = listWebhookEvents(50);
    return res.json({ logs });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao listar logs de webhook.' });
  }
});

// -------------------------------------------------------------
// 4. USER AUTHENTICATION & ACCESS CONTROL
// -------------------------------------------------------------

// Register: User signs up -> Receives 7 days free trial!
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = findUserByEmail(normalizedEmail);

  if (existingUser) {
    return res.status(409).json({ error: 'Este e-mail já está cadastrado.' });
  }

  const userId = `usr_${crypto.randomUUID()}`;
  const passwordHash = hashPassword(password);

  const newUser = createUser({
    id: userId,
    name: name.trim(),
    email: normalizedEmail,
    password_hash: passwordHash
  });

  // Calculate 7 days free trial
  const now = new Date();
  const trialEndsDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Create initial subscription with 7-day free trial!
  const newSub = createSubscription({
    id: `sub_${crypto.randomUUID()}`,
    user_id: newUser.id,
    status: 'trialing',
    plan: 'trial_7_dias',
    amount: 97.00,
    started_at: now.toISOString(),
    trial_ends_at: trialEndsDate.toISOString(),
    expires_at: trialEndsDate.toISOString()
  });

  return res.status(201).json({
    success: true,
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      createdAt: newUser.created_at
    },
    subscription: {
      status: newSub.status,
      plan: newSub.plan,
      amount: newSub.amount,
      trial_ends_at: newSub.trial_ends_at,
      expires_at: newSub.expires_at
    }
  });
});

// Login: User authenticates -> Returns user + subscription status
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = findUserByEmail(normalizedEmail);

  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  const passwordHash = hashPassword(password);
  if (user.password_hash !== passwordHash) {
    return res.status(401).json({ error: 'Senha incorreta.' });
  }

  let subscription = getSubscriptionByUserId(user.id);

  // Check if 7 days free trial has expired
  if (subscription && subscription.status === 'trialing' && subscription.trial_ends_at) {
    if (new Date() > new Date(subscription.trial_ends_at)) {
      updateSubscription(user.id, { status: 'pending_payment' });
      subscription = getSubscriptionByUserId(user.id);
    }
  }

  return res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.created_at
    },
    subscription: subscription || {
      status: 'pending_payment',
      plan: 'mensal',
      amount: 97.00
    }
  });
});

// Subscription status polling (Used on checkout screen to detect payment confirmation)
app.get('/api/auth/status', (req: Request, res: Response) => {
  const email = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : '';

  if (!email) {
    return res.status(400).json({ error: 'Parâmetro email é obrigatório.' });
  }

  const user = findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  let subscription = getSubscriptionByUserId(user.id);

  // Check if 7 days free trial has expired
  if (subscription && subscription.status === 'trialing' && subscription.trial_ends_at) {
    if (new Date() > new Date(subscription.trial_ends_at)) {
      updateSubscription(user.id, { status: 'pending_payment' });
      subscription = getSubscriptionByUserId(user.id);
    }
  }

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    },
    subscription: subscription || {
      status: 'pending_payment',
      plan: 'mensal',
      amount: 97.00
    }
  });
});

// Public config
app.get('/api/config', (_req: Request, res: Response) => {
  return res.json({
    caktoCheckoutUrl: process.env.CAKTO_CHECKOUT_URL || 'https://pay.cakto.com.br/demo-reservazen',
    webhookConfigured: Boolean(process.env.CAKTO_WEBHOOK_SECRET)
  });
});

// Root health check
app.get('/api/health', (_req: Request, res: Response) => {
  return res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ReservaZen API'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 [ReservaZen Backend] Servidor rodando na porta ${PORT}`);
  console.log(`📡 [Webhook Cakto Endpoint]: http://localhost:${PORT}/api/webhooks/cakto`);
  console.log(`🔒 [Cakto Secret Configurado]: ${process.env.CAKTO_WEBHOOK_SECRET ? 'SIM (ativo)' : 'NÃO (defina no .env)'}\n`);
});
