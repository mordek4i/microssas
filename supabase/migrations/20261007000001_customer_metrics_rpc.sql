-- Migration: 20261007000001_customer_metrics_rpc.sql
-- Description: Create indexes for appointment customer lookups and RPC get_customer_metrics

-- 1. Indexes on appointments for high performance metric aggregation
CREATE INDEX IF NOT EXISTS idx_appointments_business_customer
ON public.appointments(business_id, customer_id);

CREATE INDEX IF NOT EXISTS idx_appointments_customer_start
ON public.appointments(customer_id, start_time DESC);

-- 2. RPC get_customer_metrics
CREATE OR REPLACE FUNCTION public.get_customer_metrics(p_business_id bigint DEFAULT NULL)
RETURNS TABLE (
    customer_id bigint,
    total_bookings bigint,
    completed_bookings bigint,
    cancelled_bookings bigint,
    no_show_bookings bigint,
    last_booking_date timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_business_id bigint;
BEGIN
    -- Validar se o usuário está autenticado
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Acesso negado: Usuário não autenticado.';
    END IF;

    -- Validar e resolver o business_id garantindo que pertence ao usuário autenticado (businesses.owner_id = auth.uid())
    IF p_business_id IS NOT NULL THEN
        SELECT id INTO v_business_id
        FROM public.businesses
        WHERE id = p_business_id AND owner_id = auth.uid();

        IF v_business_id IS NULL THEN
            RAISE EXCEPTION 'Acesso negado: Estabelecimento não encontrado ou não pertence ao usuário.';
        END IF;
    ELSE
        SELECT id INTO v_business_id
        FROM public.businesses
        WHERE owner_id = auth.uid()
        ORDER BY id DESC
        LIMIT 1;

        IF v_business_id IS NULL THEN
            RETURN;
        END IF;
    END IF;

    -- Retornar métricas reais de todos os clientes pertencentes a este business_id
    RETURN QUERY
    SELECT
        c.id AS customer_id,
        COALESCE(COUNT(a.id), 0)::bigint AS total_bookings,
        COALESCE(COUNT(a.id) FILTER (WHERE LOWER(a.status) = 'completed'), 0)::bigint AS completed_bookings,
        COALESCE(COUNT(a.id) FILTER (WHERE LOWER(a.status) = 'cancelled'), 0)::bigint AS cancelled_bookings,
        COALESCE(COUNT(a.id) FILTER (WHERE LOWER(a.status) = 'no_show'), 0)::bigint AS no_show_bookings,
        MAX(a.start_time) AS last_booking_date
    FROM public.customers c
    LEFT JOIN public.appointments a 
        ON a.customer_id = c.id 
       AND a.business_id = v_business_id
    WHERE c.business_id = v_business_id
    GROUP BY c.id;
END;
$$;

-- 3. Permissões
GRANT EXECUTE ON FUNCTION public.get_customer_metrics(bigint) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_customer_metrics(bigint) FROM anon, public;
