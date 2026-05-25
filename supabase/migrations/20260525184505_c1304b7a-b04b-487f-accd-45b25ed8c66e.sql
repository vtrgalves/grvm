
CREATE TABLE public.crate_openings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  crate_slug text NOT NULL,
  crate_name text NOT NULL,
  cost_paid integer NOT NULL DEFAULT 0,
  prize_rarity text NOT NULL,
  prize_type text NOT NULL,
  prize_name text NOT NULL,
  prize_icon text NOT NULL DEFAULT '🎁',
  prize_grv integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crate_openings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Crate openings public read"
  ON public.crate_openings FOR SELECT
  TO authenticated USING (true);

CREATE INDEX idx_crate_openings_user_created ON public.crate_openings(user_id, created_at DESC);
CREATE INDEX idx_crate_openings_created ON public.crate_openings(created_at DESC);

CREATE OR REPLACE FUNCTION public.open_crate(_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _bal integer;
  _cost integer;
  _crate_name text;
  _roll numeric;
  _wc numeric; _wr numeric; _we numeric; _wl numeric;
  _rarity text;
  _prizes jsonb;
  _prize jsonb;
  _grv integer := 0;
  _id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF _slug = 'neon' THEN
    _cost := 250; _crate_name := 'Neon Crate';
    _wc := 0.70; _wr := 0.25; _we := 0.04; _wl := 0.01;
  ELSIF _slug = 'wave' THEN
    _cost := 800; _crate_name := 'Wave Crate';
    _wc := 0.45; _wr := 0.40; _we := 0.12; _wl := 0.025;
  ELSIF _slug = 'cyber' THEN
    _cost := 1500; _crate_name := 'Cyber Crate';
    _wc := 0.25; _wr := 0.40; _we := 0.25; _wl := 0.09;
  ELSIF _slug = 'genesis' THEN
    _cost := 5000; _crate_name := 'Genesis Crate';
    _wc := 0.10; _wr := 0.25; _we := 0.35; _wl := 0.25;
  ELSIF _slug = 'event' THEN
    _cost := 2000; _crate_name := 'Event Crate';
    _wc := 0.30; _wr := 0.40; _we := 0.20; _wl := 0.08;
  ELSE
    RAISE EXCEPTION 'Unknown crate';
  END IF;

  SELECT grv_points INTO _bal FROM public.profiles WHERE user_id = _uid FOR UPDATE;
  IF _bal IS NULL OR _bal < _cost THEN RAISE EXCEPTION 'Insufficient GRV'; END IF;
  UPDATE public.profiles SET grv_points = grv_points - _cost WHERE user_id = _uid;
  INSERT INTO public.point_transactions (user_id, action, points, description)
  VALUES (_uid, 'crate_open', -_cost, 'Abriu ' || _crate_name);

  _roll := random();
  IF _roll < _wc THEN _rarity := 'common';
  ELSIF _roll < _wc + _wr THEN _rarity := 'rare';
  ELSIF _roll < _wc + _wr + _we THEN _rarity := 'epic';
  ELSIF _roll < _wc + _wr + _we + _wl THEN _rarity := 'legendary';
  ELSE _rarity := 'genesis';
  END IF;

  _prizes := CASE _rarity
    WHEN 'common' THEN '[
      {"type":"grv","name":"50 GRV","icon":"🪙","grv":50},
      {"type":"grv","name":"100 GRV","icon":"🪙","grv":100},
      {"type":"grv","name":"200 GRV","icon":"🪙","grv":200},
      {"type":"cosmetic","name":"Avatar Pulse","icon":"🟦","grv":0},
      {"type":"badge","name":"Badge Listener","icon":"🎧","grv":0}
    ]'::jsonb
    WHEN 'rare' THEN '[
      {"type":"grv","name":"500 GRV","icon":"💠","grv":500},
      {"type":"boost","name":"XP Booster","icon":"⚡","grv":0},
      {"type":"cosmetic","name":"Moldura Premium","icon":"🟪","grv":0},
      {"type":"nft","name":"CyberWave","icon":"🌊","grv":0},
      {"type":"boost","name":"GRV Multiplier","icon":"🔥","grv":0}
    ]'::jsonb
    WHEN 'epic' THEN '[
      {"type":"grv","name":"1000 GRV","icon":"💎","grv":1000},
      {"type":"nft","name":"Neon Pulse","icon":"💎","grv":0},
      {"type":"boost","name":"Spotlight Boost","icon":"🚀","grv":0},
      {"type":"cosmetic","name":"Avatar Animado","icon":"✨","grv":0},
      {"type":"nft","name":"Groove Access","icon":"🎫","grv":0}
    ]'::jsonb
    WHEN 'legendary' THEN '[
      {"type":"grv","name":"2500 GRV","icon":"🏆","grv":2500},
      {"type":"nft","name":"Luna Genesis","icon":"🌙","grv":0},
      {"type":"badge","name":"Badge Legend","icon":"👑","grv":0},
      {"type":"boost","name":"Backstage Pass","icon":"🎟️","grv":0}
    ]'::jsonb
    ELSE '[
      {"type":"nft","name":"Genesis NFT","icon":"🌌","grv":0},
      {"type":"boost","name":"Genesis Aura","icon":"🌌","grv":0},
      {"type":"grv","name":"5000 GRV","icon":"💰","grv":5000},
      {"type":"cosmetic","name":"Avatar Holográfico","icon":"🪩","grv":0}
    ]'::jsonb
  END;

  _prize := _prizes->floor(random() * jsonb_array_length(_prizes))::int;
  _grv := COALESCE((_prize->>'grv')::int, 0);

  IF _grv > 0 THEN
    UPDATE public.profiles SET grv_points = grv_points + _grv WHERE user_id = _uid;
    INSERT INTO public.point_transactions (user_id, action, points, description)
    VALUES (_uid, 'crate_prize', _grv, 'Prêmio: ' || (_prize->>'name'));
  END IF;

  INSERT INTO public.crate_openings
    (user_id, crate_slug, crate_name, cost_paid, prize_rarity, prize_type, prize_name, prize_icon, prize_grv)
  VALUES (_uid, _slug, _crate_name, _cost, _rarity,
    _prize->>'type', _prize->>'name', _prize->>'icon', _grv)
  RETURNING id INTO _id;

  RETURN jsonb_build_object(
    'success', true, 'id', _id, 'cost', _cost,
    'rarity', _rarity, 'prize', _prize, 'grv_awarded', _grv
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_crate_history(_limit int DEFAULT 30)
RETURNS TABLE(
  id uuid, crate_slug text, crate_name text, cost_paid int,
  prize_rarity text, prize_type text, prize_name text, prize_icon text,
  prize_grv int, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, crate_slug, crate_name, cost_paid, prize_rarity, prize_type, prize_name, prize_icon, prize_grv, created_at
  FROM public.crate_openings
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT LEAST(COALESCE(_limit, 30), 100);
$$;

CREATE OR REPLACE FUNCTION public.get_crate_global_feed(_limit int DEFAULT 20)
RETURNS TABLE(
  id uuid, user_name text, crate_name text,
  prize_rarity text, prize_name text, prize_icon text, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.id, COALESCE(p.name, 'Anônimo'), o.crate_name,
         o.prize_rarity, o.prize_name, o.prize_icon, o.created_at
  FROM public.crate_openings o
  LEFT JOIN public.profiles p ON p.user_id = o.user_id
  WHERE o.prize_rarity IN ('rare','epic','legendary','genesis')
  ORDER BY o.created_at DESC
  LIMIT LEAST(COALESCE(_limit, 20), 50);
$$;
