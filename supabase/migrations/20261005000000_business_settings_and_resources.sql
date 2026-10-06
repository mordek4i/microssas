-- Migration: Add business_type, business_settings, resources and RLS policies

-- 1. Add business_type to businesses safely
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS business_type text;

UPDATE public.businesses SET business_type = 'RESTAURANT' WHERE business_type IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'businesses_business_type_check'
  ) THEN
    ALTER TABLE public.businesses 
      ADD CONSTRAINT businesses_business_type_check 
      CHECK (business_type IN ('RESTAURANT', 'SALON', 'CLINIC', 'STUDIO', 'EVENTS'));
  END IF;
END $$;

ALTER TABLE public.businesses ALTER COLUMN business_type SET NOT NULL;
ALTER TABLE public.businesses ALTER COLUMN business_type SET DEFAULT 'RESTAURANT';

-- 2. Add specialty column to professionals safely
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS specialty text;

-- 3. Create public.business_settings table (1:1 with businesses)
CREATE TABLE IF NOT EXISTS public.business_settings (
  business_id bigint PRIMARY KEY REFERENCES public.businesses(id) ON DELETE CASCADE,
  avg_duration_minutes integer NOT NULL DEFAULT 60,
  min_advance_hours integer NOT NULL DEFAULT 2,
  tolerance_minutes integer NOT NULL DEFAULT 15,
  auto_confirm boolean NOT NULL DEFAULT true,
  cancellation_policy text DEFAULT 'Cancelamento gratuito até 2 horas antes do horário reservado.',
  category_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Create public.resources table for spatial/physical resources
CREATE TABLE IF NOT EXISTS public.resources (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  business_id bigint NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  resource_type text NOT NULL DEFAULT 'GENERAL',
  capacity integer DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_resources_business_id ON public.resources(business_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON public.resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_services_business_id ON public.services(business_id);
CREATE INDEX IF NOT EXISTS idx_professionals_business_id ON public.professionals(business_id);
CREATE INDEX IF NOT EXISTS idx_business_hours_business_id ON public.business_hours(business_id);

-- Enable RLS
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies for business_settings
DROP POLICY IF EXISTS "Owners can view own business settings" ON public.business_settings;
CREATE POLICY "Owners can view own business settings" 
  ON public.business_settings 
  FOR SELECT 
  TO authenticated 
  USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Owners can insert own business settings" ON public.business_settings;
CREATE POLICY "Owners can insert own business settings" 
  ON public.business_settings 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Owners can update own business settings" ON public.business_settings;
CREATE POLICY "Owners can update own business settings" 
  ON public.business_settings 
  FOR UPDATE 
  TO authenticated 
  USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

DROP POLICY IF EXISTS "Owners can delete own business settings" ON public.business_settings;
CREATE POLICY "Owners can delete own business settings" 
  ON public.business_settings 
  FOR DELETE 
  TO authenticated 
  USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));

-- Drop and recreate RLS policies for resources
DROP POLICY IF EXISTS "Owners can manage resources" ON public.resources;
CREATE POLICY "Owners can manage resources" 
  ON public.resources 
  FOR ALL 
  TO authenticated 
  USING (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()))
  WITH CHECK (business_id IN (SELECT id FROM public.businesses WHERE owner_id = auth.uid()));
