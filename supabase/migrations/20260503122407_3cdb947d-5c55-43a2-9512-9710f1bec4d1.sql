
-- Enum for item kind
CREATE TYPE public.artist_item_kind AS ENUM ('nft', 'experience');

-- Artist items table
CREATE TABLE public.artist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL,
  kind public.artist_item_kind NOT NULL,
  title text NOT NULL,
  description text,
  image_url text,
  price_grv integer NOT NULL DEFAULT 0 CHECK (price_grv >= 0),
  supply integer NOT NULL DEFAULT 100 CHECK (supply > 0),
  claimed_count integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_artist_items_artist ON public.artist_items(artist_id);
CREATE INDEX idx_artist_items_kind ON public.artist_items(kind);

ALTER TABLE public.artist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Items viewable by authenticated"
  ON public.artist_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Artists can create own items"
  ON public.artist_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Artists can update own items"
  ON public.artist_items FOR UPDATE TO authenticated USING (auth.uid() = artist_id);

CREATE POLICY "Artists can delete own items"
  ON public.artist_items FOR DELETE TO authenticated USING (auth.uid() = artist_id);

CREATE TRIGGER update_artist_items_updated_at
  BEFORE UPDATE ON public.artist_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Claims table
CREATE TABLE public.item_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL REFERENCES public.artist_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  artist_id uuid NOT NULL,
  price_paid integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(item_id, user_id)
);

CREATE INDEX idx_item_claims_user ON public.item_claims(user_id);
CREATE INDEX idx_item_claims_artist ON public.item_claims(artist_id);

ALTER TABLE public.item_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own claims"
  ON public.item_claims FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = artist_id);

-- Become artist
CREATE OR REPLACE FUNCTION public.become_artist()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.profiles SET profile_type = 'musician', updated_at = now() WHERE user_id = _uid;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Create artist item
CREATE OR REPLACE FUNCTION public.create_artist_item(
  _kind public.artist_item_kind,
  _title text,
  _description text,
  _image_url text,
  _price_grv integer,
  _supply integer
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _ptype profile_type;
  _id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT profile_type INTO _ptype FROM public.profiles WHERE user_id = _uid;
  IF _ptype <> 'musician' THEN RAISE EXCEPTION 'Only artists can create items'; END IF;
  IF _title IS NULL OR length(trim(_title)) = 0 THEN RAISE EXCEPTION 'Title required'; END IF;

  INSERT INTO public.artist_items (artist_id, kind, title, description, image_url, price_grv, supply)
  VALUES (_uid, _kind, _title, _description, _image_url, COALESCE(_price_grv, 0), COALESCE(_supply, 100))
  RETURNING id INTO _id;

  RETURN jsonb_build_object('success', true, 'id', _id);
END;
$$;

-- Claim / buy item
CREATE OR REPLACE FUNCTION public.claim_artist_item(_item_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _item RECORD;
  _fan_balance integer;
  _artist_share integer;
  _label text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO _item FROM public.artist_items WHERE id = _item_id AND active = true FOR UPDATE;
  IF _item IS NULL THEN RAISE EXCEPTION 'Item not available'; END IF;
  IF _item.artist_id = _uid THEN RAISE EXCEPTION 'Cannot claim your own item'; END IF;
  IF _item.claimed_count >= _item.supply THEN RAISE EXCEPTION 'Sold out'; END IF;

  IF EXISTS (SELECT 1 FROM public.item_claims WHERE item_id = _item_id AND user_id = _uid) THEN
    RAISE EXCEPTION 'Already claimed';
  END IF;

  IF _item.price_grv > 0 THEN
    SELECT grv_points INTO _fan_balance FROM public.profiles WHERE user_id = _uid FOR UPDATE;
    IF _fan_balance < _item.price_grv THEN RAISE EXCEPTION 'Insufficient GRV'; END IF;

    UPDATE public.profiles SET grv_points = grv_points - _item.price_grv WHERE user_id = _uid;
    INSERT INTO public.point_transactions (user_id, action, points, description)
    VALUES (_uid, 'item_purchase', -_item.price_grv, 'Compra: ' || _item.title);

    -- 90% para o artista (split simulado)
    _artist_share := GREATEST(1, (_item.price_grv * 90) / 100);
    UPDATE public.profiles SET grv_points = grv_points + _artist_share WHERE user_id = _item.artist_id;
    INSERT INTO public.point_transactions (user_id, action, points, description)
    VALUES (_item.artist_id, 'item_sale', _artist_share, 'Venda: ' || _item.title);
  END IF;

  INSERT INTO public.item_claims (item_id, user_id, artist_id, price_paid)
  VALUES (_item_id, _uid, _item.artist_id, _item.price_grv);

  UPDATE public.artist_items SET claimed_count = claimed_count + 1 WHERE id = _item_id;

  RETURN jsonb_build_object('success', true, 'price', _item.price_grv);
END;
$$;

-- Trigger to keep level in sync (since previous migration only set NEW.level on update)
DROP TRIGGER IF EXISTS sync_profile_level_trg ON public.profiles;
CREATE TRIGGER sync_profile_level_trg
  BEFORE INSERT OR UPDATE OF grv_points ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_level();

-- Realtime
ALTER TABLE public.artist_items REPLICA IDENTITY FULL;
ALTER TABLE public.item_claims REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.artist_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.item_claims;
