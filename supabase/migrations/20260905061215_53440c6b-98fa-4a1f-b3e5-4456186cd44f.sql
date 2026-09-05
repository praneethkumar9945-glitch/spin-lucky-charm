-- Remove open write access: anyone could rig the wheel outcome
DROP POLICY IF EXISTS "Anyone can insert wheel settings" ON public.wheel_settings;
DROP POLICY IF EXISTS "Anyone can update wheel settings" ON public.wheel_settings;
REVOKE INSERT, UPDATE, DELETE ON public.wheel_settings FROM anon, authenticated;

-- Store the admin PIN as a hash in a table with no public access
CREATE TABLE IF NOT EXISTS public.wheel_admin_secrets (
  id text NOT NULL DEFAULT 'default' PRIMARY KEY,
  pin_hash text NOT NULL
);
ALTER TABLE public.wheel_admin_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wheel_admin_secrets FROM anon, authenticated;
GRANT ALL ON public.wheel_admin_secrets TO service_role;
INSERT INTO public.wheel_admin_secrets (id, pin_hash)
VALUES ('default', encode(extensions.digest('lucky-spin-admin-2026', 'sha256'), 'hex'))
ON CONFLICT (id) DO NOTHING;

-- Buzzer: increments the spin counter only, cannot touch prizes or outcomes
CREATE OR REPLACE FUNCTION public.request_spin()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_nonce bigint;
BEGIN
  UPDATE public.wheel_settings
  SET spin_nonce = spin_nonce + 1, updated_at = now()
  WHERE id = 'default'
  RETURNING spin_nonce INTO new_nonce;
  RETURN new_nonce;
END;
$$;
GRANT EXECUTE ON FUNCTION public.request_spin() TO anon, authenticated;

-- Admin update: verifies the PIN server-side before changing labels/forced outcome
CREATE OR REPLACE FUNCTION public.update_wheel_settings(_pin text, _labels text[], _forced_index integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash text;
BEGIN
  SELECT pin_hash INTO stored_hash FROM public.wheel_admin_secrets WHERE id = 'default';
  IF stored_hash IS NULL
     OR encode(extensions.digest(coalesce(_pin, ''), 'sha256'), 'hex') <> stored_hash THEN
    RETURN false;
  END IF;

  IF _labels IS NULL OR array_length(_labels, 1) IS NULL
     OR array_length(_labels, 1) < 2 OR array_length(_labels, 1) > 30 THEN
    RETURN false;
  END IF;

  UPDATE public.wheel_settings
  SET labels = _labels,
      forced_index = CASE
        WHEN _forced_index IS NULL OR _forced_index < -1
          OR _forced_index >= array_length(_labels, 1) THEN -1
        ELSE _forced_index
      END,
      updated_at = now()
  WHERE id = 'default';
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.update_wheel_settings(text, text[], integer) TO anon, authenticated;