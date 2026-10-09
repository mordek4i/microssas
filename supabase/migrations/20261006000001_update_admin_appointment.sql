-- ==============================================================
-- MIGRATION: 20261006000001_update_admin_appointment.sql
-- Transactional, Conflict-Aware Admin Appointment Editing
-- ==============================================================

CREATE OR REPLACE FUNCTION public.update_admin_appointment(
  p_appointment_id bigint,
  p_date date,
  p_time time,
  p_pax integer,
  p_notes text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_app RECORD;
  v_duration interval;
  v_start_ts timestamptz;
  v_end_ts timestamptz;
  v_lock_key bigint;
  v_conflict_count int;
  v_res_capacity int;
BEGIN
  -- 1. Obter a appointment pelo ID
  SELECT id, business_id, customer_id, service_id, professional_id, resource_id, start_time, end_time, status, notes, pax
  INTO v_app
  FROM public.appointments
  WHERE id = p_appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'RESERVA_NAO_ENCONTRADA: Reserva nao encontrada.';
  END IF;

  -- 2 e 3. Validar explicitamente a posse (businesses.owner_id = auth.uid())
  IF NOT EXISTS (
    SELECT 1
    FROM public.businesses
    WHERE id = v_app.business_id
      AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'ACESSO_NEGADO: Voce nao tem permissao para editar esta reserva.';
  END IF;

  -- 13. Nao permitir alteracoes de reservas com status completed ou cancelled
  IF v_app.status IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'STATUS_BLOQUEADO: Esta reserva nao pode mais ser editada pois ja foi concluida ou cancelada.';
  END IF;

  -- 7. Validar p_pax
  IF p_pax IS NULL OR p_pax < 1 THEN
    RAISE EXCEPTION 'QUANTIDADE_PESSOAS_INVALIDA: A quantidade de pessoas deve ser no minimo 1.';
  END IF;

  -- 4. Obter e preservar a duracao original da reserva
  v_duration := v_app.end_time - v_app.start_time;
  IF v_duration IS NULL OR v_duration <= interval '0 minutes' THEN
    v_duration := interval '60 minutes';
  END IF;

  -- 5. Construir o novo start_time usando p_date + p_time
  v_start_ts := (p_date::text || ' ' || p_time::text)::timestamptz;

  -- 6. Calcular novo end_time
  v_end_ts := v_start_ts + v_duration;

  -- 8. Adquirir o mesmo lock transacional da criacao publica
  v_lock_key := hashtext(v_app.business_id::text || ':' || p_date::text);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- 10. Validar capacidade do recurso se possuir resource_id e capacidade cadastrada
  IF v_app.resource_id IS NOT NULL THEN
    SELECT capacity INTO v_res_capacity
    FROM public.resources
    WHERE id = v_app.resource_id AND business_id = v_app.business_id;

    IF v_res_capacity IS NOT NULL AND v_res_capacity > 0 AND p_pax > v_res_capacity THEN
      RAISE EXCEPTION 'CAPACIDADE_INSUFICIENTE: A quantidade de pessoas excede a capacidade do recurso selecionado (% pessoas).', v_res_capacity;
    END IF;
  END IF;

  -- 9. Verificar conflitos ignorando a propria reserva (id <> p_appointment_id) e canceladas
  -- 9.1 Conflito de recurso/mesa
  IF v_app.resource_id IS NOT NULL THEN
    SELECT count(*)
    INTO v_conflict_count
    FROM public.appointments
    WHERE business_id = v_app.business_id
      AND resource_id = v_app.resource_id
      AND id <> p_appointment_id
      AND status NOT IN ('cancelled')
      AND tstzrange(start_time, end_time) && tstzrange(v_start_ts, v_end_ts);

    IF v_conflict_count > 0 THEN
      RAISE EXCEPTION 'HORARIO_INDISPONIVEL: O recurso/mesa ja possui reserva neste horario.';
    END IF;
  END IF;

  -- 9.2 Conflito de profissional
  IF v_app.professional_id IS NOT NULL THEN
    SELECT count(*)
    INTO v_conflict_count
    FROM public.appointments
    WHERE business_id = v_app.business_id
      AND professional_id = v_app.professional_id
      AND id <> p_appointment_id
      AND status NOT IN ('cancelled')
      AND tstzrange(start_time, end_time) && tstzrange(v_start_ts, v_end_ts);

    IF v_conflict_count > 0 THEN
      RAISE EXCEPTION 'HORARIO_INDISPONIVEL: O profissional ja possui agendamento neste horario.';
    END IF;
  END IF;

  -- 14. Executar UPDATE no banco de dados
  UPDATE public.appointments
  SET
    start_time = v_start_ts,
    end_time = v_end_ts,
    pax = p_pax,
    notes = NULLIF(TRIM(COALESCE(p_notes, '')), '')
  WHERE id = p_appointment_id;

  -- 15. Retornar payload jsonb de sucesso
  RETURN jsonb_build_object(
    'success', true,
    'appointment_id', p_appointment_id,
    'business_id', v_app.business_id,
    'start_time', v_start_ts,
    'end_time', v_end_ts,
    'pax', p_pax,
    'notes', NULLIF(TRIM(COALESCE(p_notes, '')), ''),
    'status', v_app.status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.update_admin_appointment(bigint, date, time, integer, text) TO authenticated;
