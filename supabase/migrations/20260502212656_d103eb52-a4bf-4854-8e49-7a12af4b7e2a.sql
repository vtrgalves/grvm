
-- Add level column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level text NOT NULL DEFAULT 'Listener';

-- Function to compute level from points
CREATE OR REPLACE FUNCTION public.compute_level(points integer)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN points >= 10000 THEN 'Legend'
    WHEN points >= 4000  THEN 'Backstage'
    WHEN points >= 1500  THEN 'Insider'
    WHEN points >= 500   THEN 'Supporter'
    ELSE 'Listener'
  END;
$$;

-- Trigger to keep level in sync
CREATE OR REPLACE FUNCTION public.sync_profile_level()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.level := public.compute_level(NEW.grv_points);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_sync_level ON public.profiles;
CREATE TRIGGER profiles_sync_level
BEFORE INSERT OR UPDATE OF grv_points ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_level();

-- Backfill existing rows
UPDATE public.profiles SET level = public.compute_level(grv_points);

-- Add updated_at trigger if missing
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- claim_mission RPC
CREATE OR REPLACE FUNCTION public.claim_mission(_mission_key text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _mission RECORD;
  _points integer;
  _label text;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Mission catalog (kept in sync with src/lib/missions.ts)
  SELECT points, label INTO _points, _label FROM (VALUES
    ('follow_3_artists', 30, 'Seguir 3 artistas'),
    ('like_5_songs', 25, 'Curtir 5 músicas'),
    ('share_1_story', 50, 'Compartilhar 1 música no Stories'),
    ('comment_1_song', 15, 'Comentar em uma música'),
    ('create_playlist', 40, 'Criar playlist com 5 músicas'),
    ('invite_1_friend', 150, 'Convidar 1 amigo'),
    ('publish_first_song', 50, 'Publicar primeira música'),
    ('add_cover_photo', 30, 'Adicionar foto de capa'),
    ('reply_3_comments', 30, 'Responder 3 comentários'),
    ('connect_social', 40, 'Conectar Instagram/Spotify'),
    ('schedule_show', 50, 'Agendar 1 show'),
    ('invite_2_musicians', 300, 'Convidar 2 músicos amigos')
  ) AS m(key, points, label) WHERE m.key = _mission_key;

  IF _points IS NULL THEN
    RAISE EXCEPTION 'Unknown mission %', _mission_key;
  END IF;

  -- Try to update only if not yet completed
  UPDATE public.user_missions
     SET completed = true, completed_at = now()
   WHERE user_id = _uid
     AND mission_key = _mission_key
     AND completed = false
  RETURNING * INTO _mission;

  IF _mission IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_completed');
  END IF;

  INSERT INTO public.point_transactions (user_id, action, points, description)
  VALUES (_uid, 'mission_complete', _points, _label);

  UPDATE public.profiles
     SET grv_points = grv_points + _points
   WHERE user_id = _uid;

  RETURN jsonb_build_object('success', true, 'points', _points, 'label', _label);
END;
$$;

-- Realtime
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.point_transactions REPLICA IDENTITY FULL;
ALTER TABLE public.user_missions REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.point_transactions;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_missions;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
