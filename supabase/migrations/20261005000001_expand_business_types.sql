-- Migration: Expand business_type constraint to separate BARBERSHOP from SALON and include additional niches

ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_business_type_check;

ALTER TABLE public.businesses 
  ADD CONSTRAINT businesses_business_type_check 
  CHECK (business_type IN (
    'RESTAURANT', 
    'BAR', 
    'CAFE', 
    'SALON', 
    'BARBERSHOP', 
    'CLINIC', 
    'SPA', 
    'STUDIO', 
    'EVENTS', 
    'OTHER'
  ));
