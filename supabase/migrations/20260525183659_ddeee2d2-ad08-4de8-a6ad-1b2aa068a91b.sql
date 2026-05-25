
-- 1. Welcome bonus 2000 for everyone
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _is_musician boolean := COALESCE(NEW.raw_user_meta_data->>'profile_type', 'fan') = 'musician';
  _bonus integer := 2000;
BEGIN
  INSERT INTO public.profiles (user_id, name, email, profile_type, grv_points)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    CASE WHEN _is_musician THEN 'musician'::profile_type ELSE 'fan'::profile_type END,
    _bonus
  );

  INSERT INTO public.point_transactions (user_id, action, points, description)
  VALUES (NEW.id, 'signup_bonus', _bonus, 'Bônus de boas-vindas Groovium');

  IF NOT _is_musician THEN
    INSERT INTO public.user_missions (user_id, mission_key) VALUES
      (NEW.id, 'follow_3_artists'),
      (NEW.id, 'like_5_songs'),
      (NEW.id, 'share_1_story'),
      (NEW.id, 'comment_1_song'),
      (NEW.id, 'create_playlist'),
      (NEW.id, 'invite_1_friend');
  ELSE
    INSERT INTO public.user_missions (user_id, mission_key) VALUES
      (NEW.id, 'publish_first_song'),
      (NEW.id, 'add_cover_photo'),
      (NEW.id, 'reply_3_comments'),
      (NEW.id, 'connect_social'),
      (NEW.id, 'schedule_show'),
      (NEW.id, 'invite_2_musicians');
  END IF;

  RETURN NEW;
END;
$function$;

-- 2. Levels: add Groove Master + Genesis Holder
CREATE OR REPLACE FUNCTION public.compute_level(points integer)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN points >= 50000 THEN 'Genesis Holder'
    WHEN points >= 25000 THEN 'Groove Master'
    WHEN points >= 10000 THEN 'Legend'
    WHEN points >= 4000  THEN 'Backstage'
    WHEN points >= 1500  THEN 'Insider'
    WHEN points >= 500   THEN 'Supporter'
    ELSE 'Listener'
  END;
$function$;

-- 3. Like reward 2 -> 5
CREATE OR REPLACE FUNCTION public.toggle_like(_post_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _existing uuid;
  _reward integer := 5;
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

    SELECT EXISTS (
      SELECT 1 FROM public.point_transactions
       WHERE user_id = _uid AND action = 'post_like' AND description = _post_id::text
    ) INTO _already_rewarded;

    IF NOT _already_rewarded THEN
      INSERT INTO public.point_transactions (user_id, action, points, description)
      VALUES (_uid, 'post_like', _reward, _post_id::text);
      UPDATE public.profiles SET grv_points = grv_points + _reward WHERE user_id = _uid;
    END IF;

    RETURN jsonb_build_object('liked', true, 'points', _reward);
  END IF;
END;
$function$;

-- 4. Follow reward 5 -> 20
CREATE OR REPLACE FUNCTION public.toggle_follow(_target uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _existing uuid;
  _target_type profile_type;
  _already_rewarded boolean;
  _reward integer := 20;
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

    RETURN jsonb_build_object('following', true, 'points', _reward);
  END IF;
END;
$function$;

-- 5. Comment reward 5 -> 10
CREATE OR REPLACE FUNCTION public.create_comment(_post_id uuid, _content text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _comment_id uuid;
  _reward integer := 10;
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
$function$;

-- 6. Daily checkin scaled rewards
CREATE OR REPLACE FUNCTION public.daily_checkin()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _uid uuid := auth.uid();
  _today date := (now() AT TIME ZONE 'UTC')::date;
  _last RECORD;
  _streak integer := 1;
  _reward integer;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF EXISTS (SELECT 1 FROM public.daily_checkins WHERE user_id = _uid AND day = _today) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_today');
  END IF;

  SELECT * INTO _last FROM public.daily_checkins
   WHERE user_id = _uid ORDER BY day DESC LIMIT 1;

  IF _last IS NOT NULL AND _last.day = _today - 1 THEN
    _streak := _last.streak + 1;
  END IF;

  _reward := CASE
    WHEN _streak >= 30 THEN 1000
    WHEN _streak >= 15 THEN 500
    WHEN _streak >= 7  THEN 300
    WHEN _streak >= 3  THEN 120
    ELSE 50
  END;

  INSERT INTO public.daily_checkins (user_id, day, streak) VALUES (_uid, _today, _streak);

  INSERT INTO public.point_transactions (user_id, action, points, description)
  VALUES (_uid, 'daily_checkin', _reward, 'Check-in diário · streak ' || _streak);

  UPDATE public.profiles SET grv_points = grv_points + _reward WHERE user_id = _uid;

  RETURN jsonb_build_object('success', true, 'points', _reward, 'streak', _streak);
END;
$function$;
