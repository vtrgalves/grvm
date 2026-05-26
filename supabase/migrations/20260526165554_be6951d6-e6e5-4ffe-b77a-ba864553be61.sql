
-- ============================================================
-- PHASE 1+2: Server-side boost catalog + secure activate_boost
-- ============================================================
CREATE TABLE IF NOT EXISTS public.boost_definitions (
  slug text PRIMARY KEY,
  name text NOT NULL,
  effect text NOT NULL,
  icon text NOT NULL DEFAULT '⚡',
  rarity text NOT NULL DEFAULT 'common',
  cost integer NOT NULL CHECK (cost >= 0),
  duration_min integer NOT NULL CHECK (duration_min > 0),
  required_points integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.boost_definitions TO authenticated;
GRANT ALL ON public.boost_definitions TO service_role;

ALTER TABLE public.boost_definitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Boost catalog viewable by authenticated" ON public.boost_definitions;
CREATE POLICY "Boost catalog viewable by authenticated"
  ON public.boost_definitions FOR SELECT TO authenticated USING (active = true);

-- Seed canonical catalog (kept in sync with src/lib/boosts.ts)
INSERT INTO public.boost_definitions (slug, name, effect, icon, rarity, cost, duration_min, required_points) VALUES
  ('xp_booster',      'XP Booster',       '+2x XP por 1 hora',                       '⚡', 'common',    300,  60,         0),
  ('grv_multiplier',  'GRV Multiplier',   '+50% GRV em missões por 2h',              '🔥', 'rare',      500,  120,        0),
  ('spotlight_boost', 'Spotlight Boost',  'Perfil em destaque no feed por 24h',      '🚀', 'epic',     1200,  1440,     500),
  ('nft_hunter',      'NFT Hunter',       '+20% chance de NFT raro em drops',        '💎', 'rare',      800,  360,     1500),
  ('backstage_pass',  'Backstage Pass',   'Acesso prioritário a experiências',       '🎧', 'epic',     2000,  4320,    4000),
  ('genesis_aura',    'Genesis Aura',     'Moldura holográfica + badge lendário',    '🌌', 'legendary',5000, 10080,   10000),
  ('weekend_boost',   'Weekend Boost',    '+100% GRV em eventos',                    '🔥', 'rare',      700,  720,        0)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, effect = EXCLUDED.effect, icon = EXCLUDED.icon,
  rarity = EXCLUDED.rarity, cost = EXCLUDED.cost,
  duration_min = EXCLUDED.duration_min, required_points = EXCLUDED.required_points,
  active = true;

-- Drop insecure signature
DROP FUNCTION IF EXISTS public.activate_boost(text, text, text, text, text, integer, integer, integer);

-- Secure server-side validated version
CREATE OR REPLACE FUNCTION public.activate_boost(_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _def public.boost_definitions%ROWTYPE;
  _bal integer;
  _expires timestamptz;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO _def FROM public.boost_definitions
   WHERE slug = _slug AND active = true;
  IF _def IS NULL THEN RAISE EXCEPTION 'Boost desconhecido'; END IF;

  -- prevent duplicate active boost of same slug
  IF EXISTS (
    SELECT 1 FROM public.user_boosts
     WHERE user_id = _uid AND slug = _slug AND expires_at > now()
  ) THEN
    RAISE EXCEPTION 'Boost já ativo';
  END IF;

  SELECT grv_points INTO _bal FROM public.profiles WHERE user_id = _uid FOR UPDATE;
  IF _bal IS NULL THEN RAISE EXCEPTION 'Perfil não encontrado'; END IF;
  IF _bal < _def.required_points THEN
    RAISE EXCEPTION 'Nível insuficiente (precisa de % GRV acumulados)', _def.required_points;
  END IF;
  IF _bal < _def.cost THEN
    RAISE EXCEPTION 'GRV insuficiente';
  END IF;

  UPDATE public.profiles SET grv_points = grv_points - _def.cost WHERE user_id = _uid;
  INSERT INTO public.point_transactions (user_id, action, points, description)
  VALUES (_uid, 'boost_activate', -_def.cost, 'Boost: ' || _def.name);

  _expires := now() + (_def.duration_min || ' minutes')::interval;

  INSERT INTO public.user_boosts (user_id, slug, name, effect, icon, rarity, cost_paid, expires_at)
  VALUES (_uid, _def.slug, _def.name, _def.effect, _def.icon, _def.rarity, _def.cost, _expires);

  RETURN jsonb_build_object(
    'success', true, 'expires_at', _expires,
    'cost', _def.cost, 'name', _def.name
  );
END;
$$;

REVOKE ALL ON FUNCTION public.activate_boost(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activate_boost(text) TO authenticated;

-- ============================================================
-- PHASE 3+4: AI rate limit table for ai-groovium
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_time
  ON public.ai_usage_log (user_id, created_at DESC);

GRANT SELECT ON public.ai_usage_log TO authenticated;
GRANT ALL ON public.ai_usage_log TO service_role;

ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own ai usage" ON public.ai_usage_log;
CREATE POLICY "Users see own ai usage"
  ON public.ai_usage_log FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
