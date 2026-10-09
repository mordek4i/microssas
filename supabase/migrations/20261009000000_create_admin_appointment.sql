-- ==============================================================
-- MIGRATION: 20261009000000_create_admin_appointment.sql
-- Description: Transactional, Conflict-Aware Admin Appointment Creation RPC
-- ==============================================================

CREATE OR REPLACE FUNCTION public.create_admin_appointment(
  p_business_id bigint,
  p_customer_name text,
  p_date date,
  p_time time,
  p_customer_phone text DEFAULT NULL,
  p_customer_email text DEFAULT NULL,
  p_service_id bigint DEFAULT NULL,
  p_professional_id bigint DEFAULT NULL,
  p_resource_id bigint DEFAULT NULL,
  p_pax integer DEFAULT 1,
  p_notes text DEFAULT NULL,
  p_duration_minutes integer DEFAULT NULL,
  p_status text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_bus RECORD;
  v_settings RECORD;
  v_serv RECORD;
  v_prof RECORD;
  v_res RECORD;
  v_conflict_count int;
  v_clean_name text;
  v_clean_phone text;
  v_phone_normalized text;
  v_clean_email text;
  v_customer_id bigint;
  v_appointment_id bigint;
  v_duration int;
  v_start_ts timestamptz;
  v_end_ts timestamptz;
  v_lock_key bigint;
  v_status text;
  v_pax int;
BEGIN
  -- 1. Validar autenticação do usuário
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'ACESSO_NEGADO: Usuario nao autenticado.';
  END IF;

  -- 2. Validar que o estabelecimento existe e pertence ao usuário autenticado (businesses.owner_id = auth.uid())
  SELECT id, name, slug, business_type, owner_id
  INTO v_bus
  FROM public.businesses
  WHERE id = p_business_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ESTABELECIMENTO_NAO_ENCONTRADO: Estabelecimento nao encontrado.';
  END IF;

  IF v_bus.owner_id <> auth.uid() THEN
    RAISE EXCEPTION 'ACESSO_NEGADO: Voce nao tem permissao para criar reservas neste estabelecimento.';
  END IF;

  -- 3. Sanitização e validações básicas de entrada
  v_clean_name := trim(coalesce(p_customer_name, ''));
  IF v_clean_name = '' THEN
    RAISE EXCEPTION 'NOME_OBRIGATORIO: O nome do cliente e obrigatorio.';
  END IF;

  IF p_date IS NULL OR p_time IS NULL THEN
    RAISE EXCEPTION 'DATA_HORA_INVALIDA: Data e horario sao obrigatorios.';
  END IF;

  v_pax := coalesce(p_pax, 1);
  IF v_pax < 1 THEN
    RAISE EXCEPTION 'QUANTIDADE_PESSOAS_INVALIDA: A quantidade de pessoas deve ser no minimo 1.';
  END IF;

  -- 4. Trava transacional (concurrency lock) por estabelecimento e data para evitar race conditions
  v_lock_key := hashtext(p_business_id::text || ':' || p_date::text);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- 5. Carregar business_settings para fallbacks
  SELECT avg_duration_minutes, auto_confirm
  INTO v_settings
  FROM public.business_settings
  WHERE business_id = p_business_id;

  IF NOT FOUND THEN
    v_settings.avg_duration_minutes := 60;
    v_settings.auto_confirm := true;
  END IF;

  -- 6. Validar serviço e calcular duração
  IF p_service_id IS NOT NULL THEN
    SELECT id, name, duration_minutes, active
    INTO v_serv
    FROM public.services
    WHERE id = p_service_id AND business_id = p_business_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'SERVICO_INVALIDO: O servico selecionado nao pertence a este estabelecimento.';
    END IF;

    IF NOT v_serv.active THEN
      RAISE EXCEPTION 'SERVICO_INATIVO: O servico selecionado nao esta ativo no momento.';
    END IF;

    v_duration := coalesce(v_serv.duration_minutes, p_duration_minutes, v_settings.avg_duration_minutes, 60);
  ELSIF p_duration_minutes IS NOT NULL AND p_duration_minutes > 0 THEN
    v_duration := p_duration_minutes;
  ELSE
    v_duration := coalesce(v_settings.avg_duration_minutes, 60);
  END IF;

  IF v_duration <= 0 THEN
    v_duration := 60;
  END IF;

  -- 7. Calcular timestamps de início e fim
  v_start_ts := (p_date::text || ' ' || p_time::text)::timestamptz;
  v_end_ts   := v_start_ts + (v_duration || ' minutes')::interval;

  -- 8. Validar profissional (se informado) e conflito de sobreposição
  IF p_professional_id IS NOT NULL THEN
    SELECT id, name, active
    INTO v_prof
    FROM public.professionals
    WHERE id = p_professional_id AND business_id = p_business_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PROFISSIONAL_INVALIDO: O profissional selecionado nao pertence a este estabelecimento.';
    END IF;

    IF NOT v_prof.active THEN
      RAISE EXCEPTION 'PROFISSIONAL_INATIVO: O profissional selecionado nao esta disponivel no momento.';
    END IF;

    SELECT count(*)
    INTO v_conflict_count
    FROM public.appointments
    WHERE business_id = p_business_id
      AND professional_id = p_professional_id
      AND status IS DISTINCT FROM 'cancelled'
      AND tstzrange(start_time, end_time) && tstzrange(v_start_ts, v_end_ts);

    IF v_conflict_count > 0 THEN
      RAISE EXCEPTION 'HORARIO_INDISPONIVEL: O profissional ja possui agendamento neste horario.';
    END IF;
  END IF;

  -- 9. Validar recurso/mesa (se informado), capacidade e conflito de sobreposição
  IF p_resource_id IS NOT NULL THEN
    SELECT id, name, capacity, active
    INTO v_res
    FROM public.resources
    WHERE id = p_resource_id AND business_id = p_business_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'RECURSO_INVALIDO: O recurso selecionado nao pertence a este estabelecimento.';
    END IF;

    IF NOT v_res.active THEN
      RAISE EXCEPTION 'RECURSO_INATIVO: O recurso selecionado nao esta ativo no momento.';
    END IF;

    -- Validar capacidade
    IF v_res.capacity IS NOT NULL AND v_res.capacity > 0 AND v_pax > v_res.capacity THEN
      RAISE EXCEPTION 'CAPACIDADE_INSUFICIENTE: A mesa/recurso selecionado comporta no maximo % pessoas (solicitado: % pessoas).', v_res.capacity, v_pax;
    END IF;

    -- Validar sobreposição de horário no recurso
    SELECT count(*)
    INTO v_conflict_count
    FROM public.appointments
    WHERE business_id = p_business_id
      AND resource_id = p_resource_id
      AND status IS DISTINCT FROM 'cancelled'
      AND tstzrange(start_time, end_time) && tstzrange(v_start_ts, v_end_ts);

    IF v_conflict_count > 0 THEN
      RAISE EXCEPTION 'HORARIO_INDISPONIVEL: O recurso selecionado ja possui reserva neste horario.';
    END IF;
  END IF;

  -- 10. Gestão de clientes (Scoped estritamente a este business_id com phone_normalized)
  v_clean_phone := trim(coalesce(p_customer_phone, ''));
  v_phone_normalized := public.normalize_phone(v_clean_phone);
  v_clean_email := lower(trim(coalesce(p_customer_email, '')));
  v_customer_id := NULL;

  -- 10.1 Prioridade 1: Buscar por business_id + phone_normalized se houver telefone normalizado
  IF v_phone_normalized IS NOT NULL THEN
    SELECT id INTO v_customer_id
    FROM public.customers
    WHERE business_id = p_business_id
      AND phone_normalized = v_phone_normalized
    ORDER BY id ASC
    LIMIT 1;
  END IF;

  -- 10.2 Prioridade 2: Se não encontrou por telefone e houver e-mail válido, buscar por business_id + lower(email)
  IF v_customer_id IS NULL AND v_clean_email <> '' THEN
    SELECT id INTO v_customer_id
    FROM public.customers
    WHERE business_id = p_business_id
      AND lower(email) = v_clean_email
    ORDER BY id ASC
    LIMIT 1;
  END IF;

  -- 10.3 Prioridade 3: Se não encontrou, criar novo registro em public.customers
  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (business_id, name, phone, phone_normalized, email)
    VALUES (
      p_business_id,
      v_clean_name,
      nullif(v_clean_phone, ''),
      v_phone_normalized,
      nullif(v_clean_email, '')
    )
    RETURNING id INTO v_customer_id;
  END IF;

  -- 11. Determinar status
  IF p_status IS NOT NULL AND p_status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show') THEN
    v_status := p_status;
  ELSIF coalesce(v_settings.auto_confirm, true) THEN
    v_status := 'confirmed';
  ELSE
    v_status := 'scheduled';
  END IF;

  -- 12. Inserir em public.appointments de forma atômica
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
    p_business_id,
    v_customer_id,
    p_service_id,
    p_professional_id,
    p_resource_id,
    v_start_ts,
    v_end_ts,
    v_pax,
    v_status,
    nullif(trim(coalesce(p_notes, '')), '')
  )
  RETURNING id INTO v_appointment_id;

  -- 13. Retornar payload jsonb estruturado
  RETURN jsonb_build_object(
    'success', true,
    'appointment_id', v_appointment_id,
    'business_id', p_business_id,
    'customer_id', v_customer_id,
    'service_id', p_service_id,
    'professional_id', p_professional_id,
    'resource_id', p_resource_id,
    'start_time', v_start_ts,
    'end_time', v_end_ts,
    'duration_minutes', v_duration,
    'pax', v_pax,
    'status', v_status,
    'notes', nullif(trim(coalesce(p_notes, '')), '')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.create_admin_appointment(
  bigint, text, date, time, text, text, bigint, bigint, bigint, integer, text, integer, text
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_admin_appointment(
  bigint, text, date, time, text, text, bigint, bigint, bigint, integer, text, integer, text
) TO authenticated;
