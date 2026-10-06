-- Migration: Create automated user trial system (7-day free trial on signup)
-- 1. Trigger function to create trial subscription automatically on new auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user_trial()
RETURNS trigger AS $$
BEGIN
  -- Insert trial subscription only if user doesn't already have one
  IF NOT EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = NEW.id) THEN
    INSERT INTO public.subscriptions (
      user_id,
      plan,
      status,
      started_at,
      expires_at,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      'trial_7_dias',
      'trialing',
      now(),
      now() + interval '7 days',
      now(),
      now()
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Defensive handling: log warning, never break auth signup
  RAISE WARNING 'Erro ao criar assinatura trial para %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_trial ON auth.users;
CREATE TRIGGER on_auth_user_created_trial
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_trial();

-- 3. Secure helper RPC to get or create subscription for authenticated user
CREATE OR REPLACE FUNCTION public.get_or_create_user_subscription(p_user_id uuid)
RETURNS public.subscriptions AS $$
DECLARE
  v_sub public.subscriptions;
BEGIN
  -- Security check: users can only query/create for themselves
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'Acesso negado: você só pode consultar ou criar sua própria assinatura.';
  END IF;

  -- Attempt to get latest subscription
  SELECT * INTO v_sub
  FROM public.subscriptions
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- If none exists, create initial 7-day trial
  IF v_sub.id IS NULL THEN
    INSERT INTO public.subscriptions (
      user_id,
      plan,
      status,
      started_at,
      expires_at,
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      'trial_7_dias',
      'trialing',
      now(),
      now() + interval '7 days',
      now(),
      now()
    )
    RETURNING * INTO v_sub;
  END IF;

  RETURN v_sub;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_or_create_user_subscription(uuid) TO authenticated;

-- 4. Safe backfill for existing test accounts without subscriptions (do not touch active/paid accounts)
INSERT INTO public.subscriptions (user_id, plan, status, started_at, expires_at, created_at, updated_at)
SELECT 
  u.id,
  'trial_7_dias',
  'trialing',
  u.created_at,
  u.created_at + interval '7 days',
  now(),
  now()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id = u.id);
