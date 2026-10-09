-- ==============================================================
-- MIGRATION: 20261007000000_customer_notes_and_vip.sql
-- Real Persistence for Customer Notes, VIP Status and Updated At
-- ==============================================================

-- 1. Add notes, is_vip, and updated_at to public.customers
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS notes text NULL,
  ADD COLUMN IF NOT EXISTS is_vip boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 2. Indexes for performance and scale
CREATE INDEX IF NOT EXISTS idx_customers_business_id
  ON public.customers(business_id);

CREATE INDEX IF NOT EXISTS idx_customers_business_phone
  ON public.customers(business_id, phone);

-- 3. Trigger to maintain updated_at on UPDATE
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_customers_updated_at ON public.customers;
CREATE TRIGGER tr_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
