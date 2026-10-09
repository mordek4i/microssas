-- Migration: 20261007000002_customer_phone_normalized.sql
-- Description: Phone normalization and duplicate prevention for public.customers

-- 1. Add phone_normalized column to public.customers
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS phone_normalized text NULL;

-- 2. Create deterministic normalize_phone helper function
CREATE OR REPLACE FUNCTION public.normalize_phone(p_phone text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_digits text;
BEGIN
  IF p_phone IS NULL OR trim(p_phone) = '' THEN
    RETURN NULL;
  END IF;

  -- Remove all non-digit characters
  v_digits := regexp_replace(p_phone, '\D', '', 'g');

  IF v_digits = '' THEN
    RETURN NULL;
  END IF;

  -- If 12 or 13 digits starting with 55 (Brazil DDI), strip 55
  IF (length(v_digits) = 12 OR length(v_digits) = 13) AND v_digits LIKE '55%' THEN
    RETURN substr(v_digits, 3);
  END IF;

  RETURN v_digits;
END;
$$;

-- 3. Populate phone_normalized for existing customers
UPDATE public.customers
SET phone_normalized = public.normalize_phone(phone)
WHERE phone IS NOT NULL;

-- 4. Create composite index for scoped lookup (NO UNIQUE constraint)
CREATE INDEX IF NOT EXISTS idx_customers_business_phone_norm
ON public.customers(business_id, phone_normalized);

-- 5. Update create_public_appointment RPC to use phone_normalized
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
  v_phone_normalized text;
  v_clean_email text;
  v_clean_name text;
  v_lock_key bigint;
  v_service_name text := NULL;
  v_professional_name text := NULL;
  v_resource_name text := NULL;
  v_available_res RECORD;
  v_has_resources boolean := false;
BEGIN
  -- 1. Input sanitization
  v_clean_name := trim(p_customer_name);
  v_clean_phone := trim(p_customer_phone);
  v_phone_normalized := public.normalize_phone(v_clean_phone);
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
  v_lock_key := hashtext(v_bus.id::text || ':' || p_date::text);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- 4. Load business_settings
  SELECT avg_duration_minutes, min_advance_hours, tolerance_minutes, auto_confirm, category_settings
  INTO v_settings
  FROM public.business_settings
  WHERE business_id = v_bus.id;

  IF NOT FOUND THEN
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

  -- 6. Calculate start_time and end_time
  v_start_ts := (p_date::text || ' ' || p_time::text)::timestamptz;
  v_end_ts   := v_start_ts + (v_duration || ' minutes')::interval;

  -- 7. Validate min_advance_hours
  v_min_advance_ts := now() + ((coalesce(v_settings.min_advance_hours, 0)) || ' hours')::interval;
  IF v_start_ts < v_min_advance_ts THEN
    RAISE EXCEPTION 'Reservas exigem antecedencia minima de % hora(s).', coalesce(v_settings.min_advance_hours, 2);
  END IF;

  -- 8. Validate business_hours
  v_day_of_week := EXTRACT(DOW FROM p_date);
  SELECT is_open, opening_time, closing_time
  INTO v_hours
  FROM public.business_hours
  WHERE business_id = v_bus.id AND day_of_week = v_day_of_week;

  IF NOT FOUND OR NOT v_hours.is_open THEN
    RAISE EXCEPTION 'O estabelecimento nao abre nesta data.';
  END IF;

  IF p_time < v_hours.opening_time OR (p_time + (v_duration || ' minutes')::interval) > v_hours.closing_time THEN
    RAISE EXCEPTION 'Horario fora do funcionamento (abre as % e fecha as %).', v_hours.opening_time, v_hours.closing_time;
  END IF;

  -- 9. Validate professional (if informed)
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

    -- Professional conflict check
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

  -- 10. Check if business has resources configured
  SELECT EXISTS (
    SELECT 1 FROM public.resources WHERE business_id = v_bus.id AND active = true
  ) INTO v_has_resources;

  -- 11. Resource / Table Handling
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

    IF p_pax IS NOT NULL AND v_res.capacity IS NOT NULL AND v_res.capacity > 0 THEN
      IF p_pax > v_res.capacity THEN
        RAISE EXCEPTION 'CAPACIDADE_INSUFICIENTE: A mesa selecionada comporta no maximo % pessoas (solicitado: % pessoas).', v_res.capacity, p_pax;
      END IF;
    END IF;

    v_resource_name := v_res.name;

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

  ELSIF v_has_resources AND v_bus.business_type IN ('RESTAURANT', 'BAR', 'CAFE', 'EVENTS') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.resources
      WHERE business_id = v_bus.id AND active = true AND (capacity IS NULL OR capacity >= p_pax)
    ) THEN
      RAISE EXCEPTION 'CAPACIDADE_INSUFICIENTE: Nao ha mesas cadastradas com capacidade para % pessoas.', p_pax;
    END IF;

    SELECT r.id, r.name, r.capacity INTO v_available_res
    FROM public.resources r
    WHERE r.business_id = v_bus.id
      AND r.active = true
      AND (r.capacity IS NULL OR r.capacity >= p_pax)
      AND NOT EXISTS (
        SELECT 1
        FROM public.appointments a
        WHERE a.business_id = v_bus.id
          AND a.resource_id = r.id
          AND a.status NOT IN ('cancelled')
          AND tstzrange(a.start_time, a.end_time) && tstzrange(v_start_ts, v_end_ts)
      )
    ORDER BY coalesce(r.capacity, 9999) ASC, r.id ASC
    LIMIT 1;

    IF v_available_res.id IS NULL THEN
      RAISE EXCEPTION 'HORARIO_INDISPONIVEL: Todas as mesas compativeis estao ocupadas neste horario.';
    END IF;

    p_resource_id := v_available_res.id;
    v_resource_name := v_available_res.name;
  END IF;

  -- 12. Validate category constraints
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

  -- 13. Customer management (Scoped strictly to this business_id with phone_normalized)
  v_customer_id := NULL;

  -- 13.1 Prioridade 1: Buscar por business_id + phone_normalized se houver telefone normalizado
  IF v_phone_normalized IS NOT NULL THEN
    SELECT id INTO v_customer_id
    FROM public.customers
    WHERE business_id = v_bus.id
      AND phone_normalized = v_phone_normalized
    ORDER BY id ASC
    LIMIT 1;
  END IF;

  -- 13.2 Prioridade 2: Se não encontrou por telefone e houver e-mail, buscar por business_id + email
  IF v_customer_id IS NULL AND v_clean_email <> '' THEN
    SELECT id INTO v_customer_id
    FROM public.customers
    WHERE business_id = v_bus.id
      AND lower(email) = v_clean_email
    ORDER BY id ASC
    LIMIT 1;
  END IF;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (business_id, name, phone, phone_normalized, email)
    VALUES (v_bus.id, v_clean_name, nullif(v_clean_phone, ''), v_phone_normalized, nullif(v_clean_email, ''))
    RETURNING id INTO v_customer_id;
  ELSE
    -- Preservar o phone original de exibição existente, atualizando apenas campos complementares
    UPDATE public.customers
    SET name = v_clean_name,
        email = coalesce(nullif(v_clean_email, ''), email),
        phone_normalized = coalesce(phone_normalized, v_phone_normalized)
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
    p_pax,
    v_status,
    nullif(trim(p_notes), '')
  )
  RETURNING id INTO v_appointment_id;

  -- 16. Return rich confirmation payload
  RETURN jsonb_build_object(
    'success', true,
    'appointment_id', v_appointment_id,
    'business_id', v_bus.id,
    'business_name', v_bus.name,
    'business_slug', v_bus.slug,
    'business_type', v_bus.business_type,
    'customer_name', v_clean_name,
    'date', p_date::text,
    'time', p_time::text,
    'duration_minutes', v_duration,
    'pax', p_pax,
    'status', v_status,
    'service_name', v_service_name,
    'professional_name', v_professional_name,
    'resource_name', v_resource_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.create_public_appointment(
  text, text, text, text, date, time, bigint, bigint, bigint, integer, text, integer
) TO anon, authenticated;
