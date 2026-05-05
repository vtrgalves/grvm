
CREATE TABLE public.live_drops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL,
  kind public.artist_item_kind NOT NULL,
  title text NOT NULL,
  description text,
  image_url text,
  price_grv integer NOT NULL DEFAULT 0,
  supply integer NOT NULL DEFAULT 100,
  claimed_count integer NOT NULL DEFAULT 0,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.live_drop_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id uuid NOT NULL REFERENCES public.live_drops(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  artist_id uuid NOT NULL,
  price_paid integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (drop_id, user_id)
);

ALTER TABLE public.live_drops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_drop_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Live drops viewable by authenticated" ON public.live_drops
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Artists can create own drops" ON public.live_drops
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = artist_id);
CREATE POLICY "Artists can update own drops" ON public.live_drops
  FOR UPDATE TO authenticated USING (auth.uid() = artist_id);
CREATE POLICY "Artists can delete own drops" ON public.live_drops
  FOR DELETE TO authenticated USING (auth.uid() = artist_id);

CREATE POLICY "Users see own drop claims" ON public.live_drop_claims
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.uid() = artist_id);

CREATE TRIGGER update_live_drops_updated_at
  BEFORE UPDATE ON public.live_drops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.live_drops;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_drop_claims;

CREATE OR REPLACE FUNCTION public.create_live_drop(
  _kind public.artist_item_kind,
  _title text,
  _description text,
  _image_url text,
  _price_grv integer,
  _supply integer,
  _starts_at timestamptz,
  _ends_at timestamptz
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _ptype public.profile_type;
  _id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT profile_type INTO _ptype FROM public.profiles WHERE user_id = _uid;
  IF _ptype <> 'musician' THEN RAISE EXCEPTION 'Only artists can create drops'; END IF;
  IF _title IS NULL OR length(trim(_title)) = 0 THEN RAISE EXCEPTION 'Title required'; END IF;
  IF _ends_at <= _starts_at THEN RAISE EXCEPTION 'End time must be after start time'; END IF;

  INSERT INTO public.live_drops
    (artist_id, kind, title, description, image_url, price_grv, supply, starts_at, ends_at)
  VALUES
    (_uid, _kind, _title, _description, _image_url,
     COALESCE(_price_grv, 0), COALESCE(_supply, 100), _starts_at, _ends_at)
  RETURNING id INTO _id;

  RETURN jsonb_build_object('success', true, 'id', _id);
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_live_drop(_drop_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _drop RECORD;
  _bal integer;
  _share integer;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO _drop FROM public.live_drops WHERE id = _drop_id AND active = true FOR UPDATE;
  IF _drop IS NULL THEN RAISE EXCEPTION 'Drop not available'; END IF;
  IF _drop.artist_id = _uid THEN RAISE EXCEPTION 'Cannot claim your own drop'; END IF;
  IF now() < _drop.starts_at THEN RAISE EXCEPTION 'Drop not started'; END IF;
  IF now() > _drop.ends_at THEN RAISE EXCEPTION 'Drop ended'; END IF;
  IF _drop.claimed_count >= _drop.supply THEN RAISE EXCEPTION 'Sold out'; END IF;
  IF EXISTS (SELECT 1 FROM public.live_drop_claims WHERE drop_id = _drop_id AND user_id = _uid) THEN
    RAISE EXCEPTION 'Already claimed';
  END IF;

  IF _drop.price_grv > 0 THEN
    SELECT grv_points INTO _bal FROM public.profiles WHERE user_id = _uid FOR UPDATE;
    IF _bal < _drop.price_grv THEN RAISE EXCEPTION 'Insufficient GRV'; END IF;

    UPDATE public.profiles SET grv_points = grv_points - _drop.price_grv WHERE user_id = _uid;
    INSERT INTO public.point_transactions (user_id, action, points, description)
    VALUES (_uid, 'live_drop_purchase', -_drop.price_grv, 'Drop ao vivo: ' || _drop.title);

    _share := GREATEST(1, (_drop.price_grv * 90) / 100);
    UPDATE public.profiles SET grv_points = grv_points + _share WHERE user_id = _drop.artist_id;
    INSERT INTO public.point_transactions (user_id, action, points, description)
    VALUES (_drop.artist_id, 'live_drop_sale', _share, 'Venda drop ao vivo: ' || _drop.title);
  END IF;

  INSERT INTO public.live_drop_claims (drop_id, user_id, artist_id, price_paid)
  VALUES (_drop_id, _uid, _drop.artist_id, _drop.price_grv);

  UPDATE public.live_drops SET claimed_count = claimed_count + 1 WHERE id = _drop_id;

  RETURN jsonb_build_object('success', true, 'price', _drop.price_grv);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_live_drops()
RETURNS TABLE (
  id uuid, artist_id uuid, artist_name text, kind public.artist_item_kind,
  title text, description text, image_url text,
  price_grv integer, supply integer, claimed_count integer,
  starts_at timestamptz, ends_at timestamptz,
  status text, claimed_by_me boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT d.id, d.artist_id, COALESCE(p.name, 'Artista'),
    d.kind, d.title, d.description, d.image_url,
    d.price_grv, d.supply, d.claimed_count,
    d.starts_at, d.ends_at,
    CASE
      WHEN now() < d.starts_at THEN 'upcoming'
      WHEN now() BETWEEN d.starts_at AND d.ends_at THEN 'live'
      ELSE 'ended'
    END,
    EXISTS (SELECT 1 FROM public.live_drop_claims c WHERE c.drop_id = d.id AND c.user_id = auth.uid())
  FROM public.live_drops d
  LEFT JOIN public.profiles p ON p.user_id = d.artist_id
  WHERE d.active = true AND d.ends_at > now() - interval '1 day'
  ORDER BY
    CASE
      WHEN now() BETWEEN d.starts_at AND d.ends_at THEN 0
      WHEN now() < d.starts_at THEN 1
      ELSE 2
    END,
    d.starts_at ASC;
$$;
