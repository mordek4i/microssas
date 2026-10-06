-- Migration: 20261005000002_public_booking_system.sql
-- Description: Implement Public Booking System (Slug, Appointments fields, Security Definer RPCs)

-- ==============================================================
-- 1. SLUGIFY FUNCTION & BUSINESSES.SLUG COLUMN
-- ==============================================================

CREATE OR REPLACE FUNCTION public.slugify(v text) 
RETURNS text AS $$
BEGIN
  -- Normalize accents
  v := translate(lower(trim(v)),
       'áàâãäåæāăąéèêëēĕėęěíìîïīĭįóòôõöøōŏőúùûüūŭůűųñçÿý',
       'aaaaaaaaaeeeeeeeeeiiiiiiioooooooooouuuuuuuuuncyy');
  -- Replace non-alphanumeric characters with hyphens
  v := regexp_replace(v, '[^a-z0-9]+', '-', 'g');
  -- Trim leading/trailing hyphens
  v := trim(both '-' from v);
  IF v = '' OR v IS NULL THEN
    v := 'estabelecimento';
  END IF;
  RETURN v;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add slug column if it doesn't exist
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS slug text;

-- Populate slug for existing records safely
DO $$
DECLARE
  r RECORD;
  v_base text;
  v_slug text;
  v_count int;
BEGIN
  FOR r IN SELECT id, name FROM public.businesses WHERE slug IS NULL OR slug = '' LOOP
    IF r.name LIKE '%@%' THEN
      v_base := public.slugify(split_part(r.name, '@', 1));
    ELSE
      v_base := public.slugify(r.name);
    END IF;

    v_slug := v_base;
    v_count := 1;
    WHILE EXISTS (SELECT 1 FROM public.businesses WHERE slug = v_slug AND id <> r.id) LOOP
      v_count := v_count + 1;
      v_slug := v_base || '-' || v_count;
    END LOOP;

    UPDATE public.businesses SET slug = v_slug WHERE id = r.id;
  END LOOP;
END $$;

-- Enforce constraints on slug
ALTER TABLE public.businesses ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_slug_key;
ALTER TABLE public.businesses ADD CONSTRAINT businesses_slug_key UNIQUE (slug);

-- ==============================================================
-- 2. APPOINTMENTS FIELDS (resource_id, pax, service_id nullable)
-- ==============================================================

-- Add resource_id and pax
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS resource_id bigint REFERENCES public.resources(id) ON DELETE SET NULL;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS pax integer;

-- CHECK on pax: must be > 0 if not null
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_pax_check;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_pax_check CHECK (pax IS NULL OR pax > 0);

-- Make service_id nullable to support table-only / space-only bookings
ALTER TABLE public.appointments ALTER COLUMN service_id DROP NOT NULL;

-- ==============================================================
-- 3. PUBLIC READ RPC: get_public_business_data(p_slug)
-- Returns only safe public data needed for booking
-- ==============================================================

CREATE OR REPLACE FUNCTION public.get_public_business_data(p_slug text)
RETURNS jsonb AS $$
DECLARE
  v_bus RECORD;
  v_settings jsonb;
  v_hours jsonb;
  v_services jsonb;
  v_professionals jsonb;
  v_resources jsonb;
BEGIN
  -- 1. Find business by slug
  SELECT id, name, slug, business_type, phone, address, description, logo_url
  INTO v_bus
  FROM public.businesses
  WHERE slug = p_slug;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- 2. Business settings (public rules only)
  SELECT jsonb_build_object(
    'avg_duration_minutes', avg_duration_minutes,
    'min_advance_hours', min_advance_hours,
    'tolerance_minutes', tolerance_minutes,
    'auto_confirm', auto_confirm,
    'cancellation_policy', cancellation_policy,
    'category_settings', category_settings
  )
  INTO v_settings
  FROM public.business_settings
  WHERE business_id = v_bus.id;

  IF v_settings IS NULL THEN
    v_settings := '{}'::jsonb;
  END IF;

  -- 3. Business hours
  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'day_of_week', day_of_week,
      'opening_time', opening_time::text,
      'closing_time', closing_time::text,
      'is_open', is_open
    ) ORDER BY day_of_week
  ), '[]'::jsonb)
  INTO v_hours
  FROM public.business_hours
  WHERE business_id = v_bus.id;

  -- 4. Active Services
  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'name', name,
      'description', description,
      'price', price,
      'duration_minutes', duration_minutes
    ) ORDER BY id
  ), '[]'::jsonb)
  INTO v_services
  FROM public.services
  WHERE business_id = v_bus.id AND active = true;

  -- 5. Active Professionals
  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'name', name,
      'specialty', specialty,
      'photo_url', photo_url
    ) ORDER BY id
  ), '[]'::jsonb)
  INTO v_professionals
  FROM public.professionals
  WHERE business_id = v_bus.id AND active = true;

  -- 6. Active Resources
  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'id', id,
      'name', name,
      'resource_type', resource_type,
      'capacity', capacity
    ) ORDER BY id
  ), '[]'::jsonb)
  INTO v_resources
  FROM public.resources
  WHERE business_id = v_bus.id AND active = true;

  RETURN jsonb_build_object(
    'business', jsonb_build_object(
      'id', v_bus.id,
      'name', v_bus.name,
      'slug', v_bus.slug,
      'business_type', v_bus.business_type,
      'phone', v_bus.phone,
      'address', v_bus.address,
      'description', v_bus.description,
      'logo_url', v_bus.logo_url
    ),
    'settings', v_settings,
    'hours', v_hours,
    'services', v_services,
    'professionals', v_professionals,
    'resources', v_resources
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_public_business_data(text) TO anon, authenticated;

-- ==============================================================
-- 4. PUBLIC BUSY SLOTS RPC: get_public_occupied_slots
-- Returns only occupied intervals [start_time, end_time]
-- ==============================================================

CREATE OR REPLACE FUNCTION public.get_public_occupied_slots(
  p_slug text,
  p_date date,
  p_professional_id bigint DEFAULT NULL,
  p_resource_id bigint DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_business_id bigint;
  v_occupied jsonb;
  v_start_of_day timestamptz;
  v_end_of_day timestamptz;
BEGIN
  SELECT id INTO v_business_id FROM public.businesses WHERE slug = p_slug;
  IF NOT FOUND THEN
    RETURN '[]'::jsonb;
  END IF;

  v_start_of_day := (p_date::text || ' 00:00:00')::timestamptz;
  v_end_of_day   := (p_date::text || ' 23:59:59')::timestamptz;

  SELECT coalesce(jsonb_agg(
    jsonb_build_object(
      'start_time', start_time,
      'end_time', end_time,
      'professional_id', professional_id,
      'resource_id', resource_id
    ) ORDER BY start_time
  ), '[]'::jsonb)
  INTO v_occupied
  FROM public.appointments
  WHERE business_id = v_business_id
    AND status NOT IN ('cancelled')
    AND start_time >= v_start_of_day
    AND start_time <= v_end_of_day
    AND (
      (p_professional_id IS NOT NULL AND professional_id = p_professional_id)
      OR
      (p_resource_id IS NOT NULL AND resource_id = p_resource_id)
      OR
      (p_professional_id IS NULL AND p_resource_id IS NULL)
    );

  RETURN v_occupied;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_public_occupied_slots(text, date, bigint, bigint) TO anon, authenticated;

-- ==============================================================
-- 5. SECURE PUBLIC BOOKING CREATION: create_public_appointment
-- Handles concurrency, validation, customer reuse, anti-conflict
-- ==============================================================

CREATE OR REPLACE FUNCTION public.create_public_appointment(
  p_business_slug text,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_date date,
  p_time time,
  p_service_id bigint DEFAULT NULL,
  p_professional_id bigint DEFAULT NULL,
  p_resource_id bigint DEFAULT NULL,
  p_pax integer DEFAULT 1,
  p_notes text DEFAULT NULL,
  p_duration_minutes integer DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_bus RECORD;
  v_settings RECORD;
  v_serv RECORD;
  v_prof RECORD;
  v_res RECORD;
  v_hours RECORD;
  v_customer_id bigint;
  v_appointment_id bigint;
  v_start_ts timestamptz;
  v_end_ts timestamptz;
  v_duration int;
  v_day_of_week int;
  v_status text;
  v_conflict_count int;
  v_min_advance_ts timestamptz;
  v_clean_phone text;
  v_clean_email text;
  v_clean_name text;
  v_lock_key bigint;
  v_service_name text := NULL;
  v_professional_name text := NULL;
  v_resource_name text := NULL;
BEGIN
  -- 1. Input sanitization
  v_clean_name := trim(p_customer_name);
  v_clean_phone := trim(p_customer_phone);
  v_clean_email := lower(trim(p_customer_email));

  IF v_clean_name IS NULL OR v_clean_name = '' THEN
    RAISE EXCEPTION 'Nome do cliente e obrigatorio.';
  END IF;

  IF (v_clean_phone IS NULL OR v_clean_phone = '') AND (v_clean_email IS NULL OR v_clean_email = '') THEN
    RAISE EXCEPTION 'Informe telefone ou e-mail para contato.';
  END IF;

  IF p_pax IS NOT NULL AND p_pax <= 0 THEN
    RAISE EXCEPTION 'A quantidade de pessoas deve ser no minimo 1.';
  END IF;

  -- 2. Locate business by slug
  SELECT id, name, slug, business_type
  INTO v_bus
  FROM public.businesses
  WHERE slug = p_business_slug;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Estabelecimento nao encontrado.';
  END IF;

  -- 3. Concurrency lock to prevent race conditions on the same business & date
  -- We use an advisory transaction lock based on business_id and date
  v_lock_key := hashtext(v_bus.id::text || ':' || p_date::text || ':' || coalesce(p_professional_id::text, '0') || ':' || coalesce(p_resource_id::text, '0'));
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- 4. Load business_settings
  SELECT avg_duration_minutes, min_advance_hours, tolerance_minutes, auto_confirm, category_settings
  INTO v_settings
  FROM public.business_settings
  WHERE business_id = v_bus.id;

  IF NOT FOUND THEN
    -- Fallback default settings if none recorded
    v_settings.avg_duration_minutes := 60;
    v_settings.min_advance_hours := 2;
    v_settings.tolerance_minutes := 15;
    v_settings.auto_confirm := true;
    v_settings.category_settings := '{}'::jsonb;
  END IF;

  -- 5. Validate and calculate duration
  IF p_service_id IS NOT NULL THEN
    SELECT id, name, duration_minutes, price, active
    INTO v_serv
    FROM public.services
    WHERE id = p_service_id AND business_id = v_bus.id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Servico invalido ou nao pertence a este estabelecimento.';
    END IF;

    IF NOT v_serv.active THEN
      RAISE EXCEPTION 'O servico selecionado nao esta ativo no momento.';
    END IF;

    v_duration := v_serv.duration_minutes;
    v_service_name := v_serv.name;
  ELSIF p_duration_minutes IS NOT NULL AND p_duration_minutes > 0 THEN
    v_duration := p_duration_minutes;
  ELSE
    v_duration := coalesce(v_settings.avg_duration_minutes, 60);
  END IF;

  -- 6. Validate professional (if informed)
  IF p_professional_id IS NOT NULL THEN
    SELECT id, name, active
    INTO v_prof
    FROM public.professionals
    WHERE id = p_professional_id AND business_id = v_bus.id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Profissional invalido ou nao pertence a este estabelecimento.';
    END IF;

    IF NOT v_prof.active THEN
      RAISE EXCEPTION 'O profissional selecionado nao esta disponivel no momento.';
    END IF;

    v_professional_name := v_prof.name;
  END IF;

  -- 7. Validate resource (if informed)
  IF p_resource_id IS NOT NULL THEN
    SELECT id, name, resource_type, capacity, active
    INTO v_res
    FROM public.resources
    WHERE id = p_resource_id AND business_id = v_bus.id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Recurso/mesa invalido ou nao pertence a este estabelecimento.';
    END IF;

    IF NOT v_res.active THEN
      RAISE EXCEPTION 'O recurso/mesa selecionado nao esta disponivel no momento.';
    END IF;

    v_resource_name := v_res.name;

    -- Validate pax against resource capacity if applicable
    IF p_pax IS NOT NULL AND v_res.capacity IS NOT NULL AND v_res.capacity > 0 THEN
      IF p_pax > v_res.capacity THEN
        RAISE EXCEPTION 'A quantidade de pessoas (%) excede a capacidade da mesa/espaco (%).', p_pax, v_res.capacity;
      END IF;
    END IF;
  END IF;

  -- 8. Validate category constraints (e.g. min/max group size for restaurant)
  IF v_bus.business_type IN ('RESTAURANT', 'BAR', 'CAFE') THEN
    IF v_settings.category_settings ? 'min_group_size' THEN
      IF p_pax < (v_settings.category_settings->>'min_group_size')::int THEN
        RAISE EXCEPTION 'Quantidade minima de pessoas para reserva: %', (v_settings.category_settings->>'min_group_size');
      END IF;
    END IF;
    IF v_settings.category_settings ? 'max_group_size' THEN
      IF p_pax > (v_settings.category_settings->>'max_group_size')::int THEN
        RAISE EXCEPTION 'Quantidade maxima de pessoas por reserva: %', (v_settings.category_settings->>'max_group_size');
      END IF;
    END IF;
  END IF;

  -- 9. Calculate start_time and end_time
  v_start_ts := (p_date::text || ' ' || p_time::text)::timestamptz;
  v_end_ts   := v_start_ts + (v_duration || ' minutes')::interval;

  -- 10. Validate min_advance_hours
  v_min_advance_ts := now() + ((coalesce(v_settings.min_advance_hours, 0)) || ' hours')::interval;
  IF v_start_ts < v_min_advance_ts THEN
    RAISE EXCEPTION 'Reservas exigem antecedencia minima de % hora(s).', coalesce(v_settings.min_advance_hours, 2);
  END IF;

  -- 11. Validate business_hours
  v_day_of_week := EXTRACT(DOW FROM p_date); -- 0=Sun, 1=Mon, ..., 6=Sat
  SELECT is_open, opening_time, closing_time
  INTO v_hours
  FROM public.business_hours
  WHERE business_id = v_bus.id AND day_of_week = v_day_of_week;

  IF NOT FOUND OR NOT v_hours.is_open THEN
    RAISE EXCEPTION 'O estabelecimento nao abre nesta data.';
  END IF;

  -- Check operating window
  IF p_time < v_hours.opening_time OR (p_time + (v_duration || ' minutes')::interval) > v_hours.closing_time THEN
    RAISE EXCEPTION 'Horario fora do funcionamento (abre as % e fecha as %).', v_hours.opening_time, v_hours.closing_time;
  END IF;

  -- 12. Anti-conflict check
  -- A) If professional is selected, check professional conflict
  IF p_professional_id IS NOT NULL THEN
    SELECT count(*)
    INTO v_conflict_count
    FROM public.appointments
    WHERE business_id = v_bus.id
      AND professional_id = p_professional_id
      AND status NOT IN ('cancelled')
      AND tstzrange(start_time, end_time) && tstzrange(v_start_ts, v_end_ts);

    IF v_conflict_count > 0 THEN
      RAISE EXCEPTION 'HORARIO_INDISPONIVEL: O profissional ja possui agendamento neste horario.';
    END IF;
  END IF;

  -- B) If resource/table is selected, check resource conflict
  IF p_resource_id IS NOT NULL THEN
    SELECT count(*)
    INTO v_conflict_count
    FROM public.appointments
    WHERE business_id = v_bus.id
      AND resource_id = p_resource_id
      AND status NOT IN ('cancelled')
      AND tstzrange(start_time, end_time) && tstzrange(v_start_ts, v_end_ts);

    IF v_conflict_count > 0 THEN
      RAISE EXCEPTION 'HORARIO_INDISPONIVEL: A mesa/espaco ja possui reserva neste horario.';
    END IF;
  END IF;

  -- 13. Customer management (Scoped strictly to this business_id)
  SELECT id INTO v_customer_id
  FROM public.customers
  WHERE business_id = v_bus.id
    AND (
      (v_clean_phone <> '' AND phone = v_clean_phone)
      OR
      (v_clean_email <> '' AND lower(email) = v_clean_email)
    )
  ORDER BY id ASC
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (business_id, name, phone, email)
    VALUES (v_bus.id, v_clean_name, v_clean_phone, nullif(v_clean_email, ''))
    RETURNING id INTO v_customer_id;
  ELSE
    -- Keep contact name updated if provided
    UPDATE public.customers
    SET name = v_clean_name,
        phone = coalesce(nullif(v_clean_phone, ''), phone),
        email = coalesce(nullif(v_clean_email, ''), email)
    WHERE id = v_customer_id;
  END IF;

  -- 14. Determine status based on auto_confirm
  IF coalesce(v_settings.auto_confirm, true) THEN
    v_status := 'confirmed';
  ELSE
    v_status := 'scheduled';
  END IF;

  -- 15. Insert into appointments
  INSERT INTO public.appointments (
    business_id,
    customer_id,
    service_id,
    professional_id,
    resource_id,
    start_time,
    end_time,
    pax,
    status,
    notes
  )
  VALUES (
    v_bus.id,
    v_customer_id,
    p_service_id,
    p_professional_id,
    p_resource_id,
    v_start_ts,
    v_end_ts,
    coalesce(p_pax, 1),
    v_status,
    nullif(trim(p_notes), '')
  )
  RETURNING id INTO v_appointment_id;

  -- 16. Return full confirmation object
  RETURN jsonb_build_object(
    'success', true,
    'appointment_id', v_appointment_id,
    'status', v_status,
    'business_name', v_bus.name,
    'business_slug', v_bus.slug,
    'business_type', v_bus.business_type,
    'customer_name', v_clean_name,
    'customer_phone', v_clean_phone,
    'date', p_date::text,
    'time', p_time::text,
    'duration_minutes', v_duration,
    'pax', coalesce(p_pax, 1),
    'service_name', v_service_name,
    'professional_name', v_professional_name,
    'resource_name', v_resource_name,
    'notes', p_notes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_public_appointment(
  text, text, text, text, date, time, bigint, bigint, bigint, integer, text, integer
) TO anon, authenticated;
