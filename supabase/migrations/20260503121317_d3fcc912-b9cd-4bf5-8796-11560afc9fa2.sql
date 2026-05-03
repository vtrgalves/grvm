-- Posts
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  likes_count integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are viewable by authenticated users"
  ON public.posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create their own posts"
  ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts"
  ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts"
  ON public.posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_posts_created_at ON public.posts (created_at DESC);
CREATE INDEX idx_posts_user_id ON public.posts (user_id);

-- Likes
CREATE TABLE public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by authenticated users"
  ON public.post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can like posts"
  ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike own likes"
  ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Comments
CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 300),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are viewable by authenticated users"
  ON public.post_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create their own comments"
  ON public.post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments"
  ON public.post_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments"
  ON public.post_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_comments_post_id ON public.post_comments (post_id, created_at);

-- RPC: create_post (insert + reward GRV)
CREATE OR REPLACE FUNCTION public.create_post(_content text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _post_id uuid;
  _reward integer := 10;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _content IS NULL OR char_length(trim(_content)) = 0 THEN
    RAISE EXCEPTION 'Empty content';
  END IF;

  INSERT INTO public.posts (user_id, content) VALUES (_uid, _content)
  RETURNING id INTO _post_id;

  INSERT INTO public.point_transactions (user_id, action, points, description)
  VALUES (_uid, 'post_create', _reward, 'Publicação no feed');

  UPDATE public.profiles SET grv_points = grv_points + _reward WHERE user_id = _uid;

  RETURN jsonb_build_object('success', true, 'post_id', _post_id, 'points', _reward);
END;
$$;

-- RPC: toggle_like (returns new state; rewards GRV only on first like for that post)
CREATE OR REPLACE FUNCTION public.toggle_like(_post_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _existing uuid;
  _reward integer := 2;
  _already_rewarded boolean;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT id INTO _existing FROM public.post_likes
   WHERE post_id = _post_id AND user_id = _uid;

  IF _existing IS NOT NULL THEN
    DELETE FROM public.post_likes WHERE id = _existing;
    UPDATE public.posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = _post_id;
    RETURN jsonb_build_object('liked', false);
  ELSE
    INSERT INTO public.post_likes (post_id, user_id) VALUES (_post_id, _uid);
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = _post_id;

    -- reward only if user has never been rewarded for liking THIS post
    SELECT EXISTS (
      SELECT 1 FROM public.point_transactions
       WHERE user_id = _uid AND action = 'post_like' AND description = _post_id::text
    ) INTO _already_rewarded;

    IF NOT _already_rewarded THEN
      INSERT INTO public.point_transactions (user_id, action, points, description)
      VALUES (_uid, 'post_like', _reward, _post_id::text);
      UPDATE public.profiles SET grv_points = grv_points + _reward WHERE user_id = _uid;
    END IF;

    RETURN jsonb_build_object('liked', true);
  END IF;
END;
$$;

-- RPC: create_comment
CREATE OR REPLACE FUNCTION public.create_comment(_post_id uuid, _content text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _comment_id uuid;
  _reward integer := 5;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _content IS NULL OR char_length(trim(_content)) = 0 THEN
    RAISE EXCEPTION 'Empty content';
  END IF;

  INSERT INTO public.post_comments (post_id, user_id, content) VALUES (_post_id, _uid, _content)
  RETURNING id INTO _comment_id;

  UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = _post_id;

  INSERT INTO public.point_transactions (user_id, action, points, description)
  VALUES (_uid, 'post_comment', _reward, 'Comentário no feed');

  UPDATE public.profiles SET grv_points = grv_points + _reward WHERE user_id = _uid;

  RETURN jsonb_build_object('success', true, 'comment_id', _comment_id, 'points', _reward);
END;
$$;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;