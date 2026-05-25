
CREATE TABLE IF NOT EXISTS public.user_boosts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  effect text NOT NULL,
  icon text NOT NULL DEFAULT '⚡',
  rarity text NOT NULL DEFAULT 'common',
  cost_paid integer NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_boosts_user_active ON public.user_boosts(user_id, expires_at);

ALTER TABLE public.user_boosts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own boosts" ON public.user_boosts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.activate_boost(
  _slug text, _name text, _effect text, _icon text, _rarity text,
  _cost integer, _duration_min integer, _required_points integer
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _bal integer;
  _id uuid;
  _exp timestamptz;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _cost < 0 OR _duration_min <= 0 THEN RAISE EXCEPTION 'Invalid params'; END IF;

  SELECT grv_points INTO _bal FROM public.profiles WHERE user_id = _uid FOR UPDATE;
  IF _bal IS NULL OR _bal < _cost THEN RAISE EXCEPTION 'Insufficient GRV'; END IF;
  IF _bal < _required_points THEN RAISE EXCEPTION 'Level too low'; END IF;

  IF EXISTS (SELECT 1 FROM public.user_boosts
              WHERE user_id = _uid AND slug = _slug AND expires_at > now()) THEN
    RAISE EXCEPTION 'Boost already active';
  END IF;

  UPDATE public.profiles SET grv_points = grv_points - _cost WHERE user_id = _uid;
  INSERT INTO public.point_transactions (user_id, action, points, description)
  VALUES (_uid, 'boost_activate', -_cost, 'Boost: ' || _name);

  _exp := now() + (_duration_min || ' minutes')::interval;

  INSERT INTO public.user_boosts (user_id, slug, name, effect, icon, rarity, cost_paid, expires_at)
  VALUES (_uid, _slug, _name, _effect, _icon, _rarity, _cost, _exp)
  RETURNING id INTO _id;

  RETURN jsonb_build_object('success', true, 'id', _id, 'expires_at', _exp, 'cost', _cost);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_active_boosts()
RETURNS TABLE(id uuid, slug text, name text, effect text, icon text, rarity text, expires_at timestamptz, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, slug, name, effect, icon, rarity, expires_at, created_at
  FROM public.user_boosts
  WHERE user_id = auth.uid() AND expires_at > now()
  ORDER BY expires_at ASC;
$$;
