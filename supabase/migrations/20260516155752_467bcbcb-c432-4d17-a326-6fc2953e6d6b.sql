
-- Enum de raridade
CREATE TYPE public.badge_rarity AS ENUM ('common','rare','epic','legendary');

-- Catálogo de badges
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT '🏆',
  rarity public.badge_rarity NOT NULL DEFAULT 'common',
  burn_cost integer NOT NULL DEFAULT 0,
  supply integer NOT NULL DEFAULT 1000,
  claimed_count integer NOT NULL DEFAULT 0,
  required_level text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Badges são públicas" ON public.badges FOR SELECT USING (true);

-- Badges resgatadas por usuário
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  burned_grv integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User badges são públicas" ON public.user_badges FOR SELECT USING (true);

CREATE INDEX idx_user_badges_user ON public.user_badges(user_id);

-- Função: queimar GRV e resgatar badge
CREATE OR REPLACE FUNCTION public.burn_for_badge(_badge_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _badge RECORD;
  _bal integer;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO _badge FROM public.badges WHERE id = _badge_id AND active = true FOR UPDATE;
  IF _badge IS NULL THEN RAISE EXCEPTION 'Badge não disponível'; END IF;
  IF _badge.claimed_count >= _badge.supply THEN RAISE EXCEPTION 'Esgotada'; END IF;

  IF EXISTS (SELECT 1 FROM public.user_badges WHERE user_id = _uid AND badge_id = _badge_id) THEN
    RAISE EXCEPTION 'Você já possui esta badge';
  END IF;

  SELECT grv_points INTO _bal FROM public.profiles WHERE user_id = _uid FOR UPDATE;
  IF _bal IS NULL OR _bal < _badge.burn_cost THEN
    RAISE EXCEPTION 'GRV insuficiente';
  END IF;

  -- Burn permanente (não vai para ninguém)
  IF _badge.burn_cost > 0 THEN
    UPDATE public.profiles SET grv_points = grv_points - _badge.burn_cost WHERE user_id = _uid;
    INSERT INTO public.point_transactions (user_id, action, points, description)
    VALUES (_uid, 'badge_burn', -_badge.burn_cost, 'Burn: ' || _badge.title);
  END IF;

  INSERT INTO public.user_badges (user_id, badge_id, burned_grv)
  VALUES (_uid, _badge_id, _badge.burn_cost);

  UPDATE public.badges SET claimed_count = claimed_count + 1 WHERE id = _badge_id;

  RETURN jsonb_build_object('success', true, 'burned', _badge.burn_cost, 'title', _badge.title);
END;
$$;

-- Função: listar badges com status do usuário atual
CREATE OR REPLACE FUNCTION public.get_badges_catalog()
RETURNS TABLE(
  id uuid, slug text, title text, description text, icon text,
  rarity public.badge_rarity, burn_cost integer, supply integer,
  claimed_count integer, required_level text, owned boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT b.id, b.slug, b.title, b.description, b.icon, b.rarity,
    b.burn_cost, b.supply, b.claimed_count, b.required_level,
    EXISTS (SELECT 1 FROM public.user_badges ub WHERE ub.badge_id = b.id AND ub.user_id = auth.uid())
  FROM public.badges b
  WHERE b.active = true
  ORDER BY 
    CASE b.rarity WHEN 'common' THEN 1 WHEN 'rare' THEN 2 WHEN 'epic' THEN 3 WHEN 'legendary' THEN 4 END,
    b.burn_cost;
$$;

-- Função: badges de um perfil específico
CREATE OR REPLACE FUNCTION public.get_user_badges(_user_id uuid)
RETURNS TABLE(
  id uuid, slug text, title text, description text, icon text,
  rarity public.badge_rarity, burned_grv integer, earned_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT b.id, b.slug, b.title, b.description, b.icon, b.rarity,
    ub.burned_grv, ub.created_at
  FROM public.user_badges ub
  JOIN public.badges b ON b.id = ub.badge_id
  WHERE ub.user_id = _user_id
  ORDER BY 
    CASE b.rarity WHEN 'legendary' THEN 1 WHEN 'epic' THEN 2 WHEN 'rare' THEN 3 ELSE 4 END,
    ub.created_at DESC;
$$;

-- Seed inicial
INSERT INTO public.badges (slug, title, description, icon, rarity, burn_cost, supply) VALUES
  ('early-adopter', 'Early Adopter', 'Esteve aqui desde o início da revolução Groovium', '🚀', 'rare', 200, 500),
  ('first-burn', 'First Burn', 'Queimou GRV pela primeira vez. Sem volta.', '🔥', 'common', 50, 9999),
  ('crate-digger', 'Crate Digger', 'Caçador de raridades sonoras', '💿', 'rare', 300, 300),
  ('top-supporter', 'Top Supporter', 'Banca os artistas independentes', '💎', 'epic', 1000, 100),
  ('night-owl', 'Night Owl', 'Ativo na madrugada, onde o som corre solto', '🌙', 'common', 80, 1500),
  ('tastemaker', 'Tastemaker', 'Define tendências antes de virarem mainstream', '🎯', 'epic', 1500, 80),
  ('collector', 'Collector', 'Curador oficial de drops raros', '🗃️', 'epic', 2000, 50),
  ('groovium-legend', 'Groovium Legend', 'O panteão. Apenas os escolhidos.', '👑', 'legendary', 5000, 10);
