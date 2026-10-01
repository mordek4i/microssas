import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

// Ensure data directory exists
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'reservazen.db');
export const db = new DatabaseSync(dbPath);

// Initialize schema
export function initDatabase() {
  db.exec('PRAGMA foreign_keys = ON;');

  // 1. Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // 2. Subscriptions Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL,
      plan TEXT NOT NULL DEFAULT 'mensal',
      cakto_product_id TEXT,
      cakto_order_id TEXT,
      cakto_subscription_id TEXT,
      amount REAL DEFAULT 0,
      started_at TEXT,
      expires_at TEXT,
      trial_ends_at TEXT,
      canceled_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Migration: Ensure trial_ends_at exists for existing databases
  try {
    db.exec('ALTER TABLE subscriptions ADD COLUMN trial_ends_at TEXT;');
  } catch {
    // Column already exists
  }

  // 3. Webhook Events Table (Auditing & Idempotence)
  db.exec(`
    CREATE TABLE IF NOT EXISTS webhook_events (
      id TEXT PRIMARY KEY,
      event_id TEXT,
      event_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      processed INTEGER NOT NULL DEFAULT 0,
      processed_at TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
    CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);
    CREATE INDEX IF NOT EXISTS idx_subscriptions_cakto_order ON subscriptions(cakto_order_id);
  `);
}

// User types & helpers
export interface DbUser {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export type SubscriptionStatus = 'trialing' | 'pending_payment' | 'active' | 'canceled' | 'refunded' | 'chargeback';

export interface DbSubscription {
  id: string;
  user_id: string;
  status: SubscriptionStatus;
  plan: string;
  cakto_product_id: string | null;
  cakto_order_id: string | null;
  cakto_subscription_id: string | null;
  amount: number;
  started_at: string | null;
  expires_at: string | null;
  trial_ends_at: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbWebhookEvent {
  id: string;
  event_id: string | null;
  event_type: string;
  payload: string;
  processed: number;
  processed_at: string | null;
  created_at: string;
}

// Helper database queries
export function findUserByEmail(email: string): DbUser | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1');
  return stmt.get(email.trim()) as DbUser | undefined;
}

export function findUserById(id: string): DbUser | undefined {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
  return stmt.get(id) as DbUser | undefined;
}

export function createUser(data: { id: string; name: string; email: string; password_hash: string }): DbUser {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(data.id, data.name, data.email.trim().toLowerCase(), data.password_hash, now);
  return {
    id: data.id,
    name: data.name,
    email: data.email.trim().toLowerCase(),
    password_hash: data.password_hash,
    created_at: now
  };
}

export function getSubscriptionByUserId(userId: string): DbSubscription | undefined {
  const stmt = db.prepare('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1');
  return stmt.get(userId) as DbSubscription | undefined;
}

export function createSubscription(data: {
  id: string;
  user_id: string;
  status: SubscriptionStatus;
  plan?: string;
  amount?: number;
  cakto_product_id?: string | null;
  cakto_order_id?: string | null;
  cakto_subscription_id?: string | null;
  started_at?: string | null;
  expires_at?: string | null;
  trial_ends_at?: string | null;
}): DbSubscription {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO subscriptions (
      id, user_id, status, plan, cakto_product_id, cakto_order_id,
      cakto_subscription_id, amount, started_at, expires_at, trial_ends_at, canceled_at,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)
  `);
  stmt.run(
    data.id,
    data.user_id,
    data.status,
    data.plan || 'mensal',
    data.cakto_product_id || null,
    data.cakto_order_id || null,
    data.cakto_subscription_id || null,
    data.amount || 0,
    data.started_at || null,
    data.expires_at || null,
    data.trial_ends_at || null,
    now,
    now
  );

  return {
    id: data.id,
    user_id: data.user_id,
    status: data.status,
    plan: data.plan || 'mensal',
    cakto_product_id: data.cakto_product_id || null,
    cakto_order_id: data.cakto_order_id || null,
    cakto_subscription_id: data.cakto_subscription_id || null,
    amount: data.amount || 0,
    started_at: data.started_at || null,
    expires_at: data.expires_at || null,
    trial_ends_at: data.trial_ends_at || null,
    canceled_at: null,
    created_at: now,
    updated_at: now
  };
}

export function updateSubscription(userId: string, updates: Partial<DbSubscription>): void {
  const now = new Date().toISOString();
  const current = getSubscriptionByUserId(userId);
  if (!current) return;

  const newStatus = updates.status !== undefined ? updates.status : current.status;
  const newPlan = updates.plan !== undefined ? updates.plan : current.plan;
  const newCaktoProductId = updates.cakto_product_id !== undefined ? updates.cakto_product_id : current.cakto_product_id;
  const newCaktoOrderId = updates.cakto_order_id !== undefined ? updates.cakto_order_id : current.cakto_order_id;
  const newCaktoSubId = updates.cakto_subscription_id !== undefined ? updates.cakto_subscription_id : current.cakto_subscription_id;
  const newAmount = updates.amount !== undefined ? updates.amount : current.amount;
  const newStartedAt = updates.started_at !== undefined ? updates.started_at : current.started_at;
  const newExpiresAt = updates.expires_at !== undefined ? updates.expires_at : current.expires_at;
  const newTrialEndsAt = updates.trial_ends_at !== undefined ? updates.trial_ends_at : current.trial_ends_at;
  const newCanceledAt = updates.canceled_at !== undefined ? updates.canceled_at : current.canceled_at;

  const stmt = db.prepare(`
    UPDATE subscriptions
    SET status = ?, plan = ?, cakto_product_id = ?, cakto_order_id = ?,
        cakto_subscription_id = ?, amount = ?, started_at = ?, expires_at = ?,
        trial_ends_at = ?, canceled_at = ?, updated_at = ?
    WHERE user_id = ?
  `);

  stmt.run(
    newStatus,
    newPlan,
    newCaktoProductId,
    newCaktoOrderId,
    newCaktoSubId,
    newAmount,
    newStartedAt,
    newExpiresAt,
    newTrialEndsAt,
    newCanceledAt,
    now,
    userId
  );
}

// Webhook Idempotency & Logging
export function findProcessedWebhookEvent(eventIdOrOrderId: string): DbWebhookEvent | undefined {
  const stmt = db.prepare(`
    SELECT * FROM webhook_events
    WHERE (event_id = ? OR id = ?) AND processed = 1
    LIMIT 1
  `);
  return stmt.get(eventIdOrOrderId, eventIdOrOrderId) as DbWebhookEvent | undefined;
}

export function saveWebhookEvent(data: {
  id: string;
  event_id: string | null;
  event_type: string;
  payload: string;
  processed: number;
}): void {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO webhook_events (id, event_id, event_type, payload, processed, processed_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    data.id,
    data.event_id,
    data.event_type,
    data.payload,
    data.processed,
    data.processed === 1 ? now : null,
    now
  );
}

export function listWebhookEvents(limit = 20): DbWebhookEvent[] {
  const stmt = db.prepare('SELECT * FROM webhook_events ORDER BY created_at DESC LIMIT ?');
  return stmt.all(limit) as DbWebhookEvent[];
}
