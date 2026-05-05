
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS handle text UNIQUE;

-- Backfill handle for existing profiles
UPDATE public.profiles
   SET handle = lower(regexp_replace(coalesce(name,'user'), '[^a-zA-Z0-9]+', '', 'g')) || substr(user_id::text,1,6)
 WHERE handle IS NULL;

CREATE TABLE public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Follows viewable by authenticated" ON public.follows
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can follow" ON public.follows
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows
  FOR DELETE TO authenticated USING (auth.uid() = follower_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;

CREATE OR REPLACE FUNCTION public.toggle_follow(_target uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _existing uuid;
  _target_type profile_type;
  _already_rewarded boolean;
  _reward integer := 5;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _uid = _target THEN RAISE EXCEPTION 'Cannot follow yourself'; END IF;

  SELECT id INTO _existing FROM public.follows
   WHERE follower_id = _uid AND following_id = _target;

  IF _existing IS NOT NULL THEN
    DELETE FROM public.follows WHERE id = _existing;
    RETURN jsonb_build_object('following', false);
  ELSE
    INSERT INTO public.follows (follower_id, following_id) VALUES (_uid, _target);

    SELECT profile_type INTO _target_type FROM public.profiles WHERE user_id = _target;
    IF _target_type = 'musician' THEN
      SELECT EXISTS (
        SELECT 1 FROM public.point_transactions
         WHERE user_id = _uid AND action = 'follow_artist' AND description = _target::text
      ) INTO _already_rewarded;

      IF NOT _already_rewarded THEN
        INSERT INTO public.point_transactions (user_id, action, points, description)
        VALUES (_uid, 'follow_artist', _reward, _target::text);
        UPDATE public.profiles SET grv_points = grv_points + _reward WHERE user_id = _uid;
      END IF;
    END IF;

    RETURN jsonb_build_object('following', true);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_profile(_handle text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _p RECORD;
  _followers int;
  _following int;
  _is_following boolean;
  _items jsonb;
BEGIN
  SELECT * INTO _p FROM public.profiles WHERE handle = _handle;
  IF _p IS NULL THEN RETURN NULL; END IF;

  SELECT count(*) INTO _followers FROM public.follows WHERE following_id = _p.user_id;
  SELECT count(*) INTO _following FROM public.follows WHERE follower_id = _p.user_id;

  _is_following := EXISTS (
    SELECT 1 FROM public.follows
     WHERE follower_id = _uid AND following_id = _p.user_id
  );

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', i.id, 'kind', i.kind, 'title', i.title,
    'image_url', i.image_url, 'price_grv', i.price_grv,
    'supply', i.supply, 'claimed_count', i.claimed_count
  ) ORDER BY i.created_at DESC), '[]'::jsonb) INTO _items
  FROM public.artist_items i WHERE i.artist_id = _p.user_id AND i.active = true;

  RETURN jsonb_build_object(
    'user_id', _p.user_id, 'handle', _p.handle, 'name', _p.name,
    'bio', _p.bio, 'photo_url', _p.photo_url, 'level', _p.level,
    'grv_points', _p.grv_points, 'profile_type', _p.profile_type,
    'city', _p.city, 'created_at', _p.created_at,
    'followers', _followers, 'following', _following,
    'is_following', _is_following, 'is_self', _uid = _p.user_id,
    'items', _items
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_feed(_only_following boolean DEFAULT false, _limit integer DEFAULT 50)
RETURNS TABLE (
  id uuid, user_id uuid, content text, created_at timestamptz,
  likes_count int, comments_count int,
  author_name text, author_handle text, author_level text,
  author_photo text, author_type profile_type, liked_by_me boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.id, p.user_id, p.content, p.created_at,
    p.likes_count, p.comments_count,
    pr.name, pr.handle, pr.level, pr.photo_url, pr.profile_type,
    EXISTS (SELECT 1 FROM public.post_likes l WHERE l.post_id = p.id AND l.user_id = auth.uid())
  FROM public.posts p
  LEFT JOIN public.profiles pr ON pr.user_id = p.user_id
  WHERE NOT _only_following
     OR p.user_id = auth.uid()
     OR p.user_id IN (SELECT following_id FROM public.follows WHERE follower_id = auth.uid())
  ORDER BY p.created_at DESC
  LIMIT LEAST(COALESCE(_limit, 50), 200);
$$;
