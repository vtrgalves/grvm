
-- Catálogo de benefícios VIP
CREATE TABLE public.vip_perks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT '🎁',
  required_level text NOT NULL,
  required_points integer NOT NULL DEFAULT 0,
  cost_grv integer NOT NULL DEFAULT 0,
  supply integer NOT NULL DEFAULT 100,
  claimed_count integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vip_perks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "VIP perks viewable by authenticated"
  ON public.vip_perks FOR SELECT TO authenticated USING (true);

-- Resgates
CREATE TABLE public.vip_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  perk_id uuid NOT NULL REFERENCES public.vip_perks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  cost_paid integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (perk_id, user_id)
);

ALTER TABLE public.vip_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own vip claims"
  ON public.vip_claims FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.vip_perks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.vip_claims;

-- RPC de resgate
CREATE OR REPLACE FUNCTION public.claim_vip_perk(_perk_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _perk RECORD;
  _user_points integer;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO _perk FROM public.vip_perks WHERE id = _perk_id AND active = true FOR UPDATE;
  IF _perk IS NULL THEN RAISE EXCEPTION 'Perk not available'; END IF;
  IF _perk.claimed_count >= _perk.supply THEN RAISE EXCEPTION 'Sold out'; END IF;

  IF EXISTS (SELECT 1 FROM public.vip_claims WHERE perk_id = _perk_id AND user_id = _uid) THEN
    RAISE EXCEPTION 'Already claimed';
  END IF;

  SELECT grv_points INTO _user_points FROM public.profiles WHERE user_id = _uid FOR UPDATE;
  IF _user_points < _perk.required_points THEN
    RAISE EXCEPTION 'Level too low';
  END IF;

  IF _perk.cost_grv > 0 THEN
    IF _user_points < _perk.cost_grv THEN RAISE EXCEPTION 'Insufficient GRV'; END IF;
    UPDATE public.profiles SET grv_points = grv_points - _perk.cost_grv WHERE user_id = _uid;
    INSERT INTO public.point_transactions (user_id, action, points, description)
    VALUES (_uid, 'vip_claim', -_perk.cost_grv, 'VIP: ' || _perk.title);
  ELSE
    INSERT INTO public.point_transactions (user_id, action, points, description)
    VALUES (_uid, 'vip_claim', 0, 'VIP: ' || _perk.title);
  END IF;

  INSERT INTO public.vip_claims (perk_id, user_id, cost_paid)
  VALUES (_perk_id, _uid, _perk.cost_grv);

  UPDATE public.vip_perks SET claimed_count = claimed_count + 1 WHERE id = _perk_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Catálogo inicial
INSERT INTO public.vip_perks (title, description, icon, required_level, required_points, cost_grv, supply) VALUES
  ('Badge Supporter Animado', 'Badge exclusivo brilhante no seu perfil.', '🎖️', 'Supporter', 500, 100, 500),
  ('Sala de Escuta Privada', 'Acesso a sessões fechadas com previews de novos lançamentos.', '🎧', 'Insider', 1500, 250, 200),
  ('Sorteio Mensal de NFT Raro', 'Concorra a um NFT exclusivo Groovium toda semana.', '🎰', 'Insider', 1500, 0, 1000),
  ('Meet & Greet Virtual', 'Encontro online com um artista parceiro.', '🎤', 'Backstage', 4000, 800, 50),
  ('Acesso Antecipado a Drops', 'Compre NFTs e experiências 24h antes dos demais.', '⏰', 'Backstage', 4000, 500, 100),
  ('Clube VIP Lendário', 'Status de Lenda + experiências secretas trimestrais.', '👑', 'Legend', 10000, 0, 25);
