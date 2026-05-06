
-- TIPS
CREATE TABLE public.tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid NOT NULL,
  to_user uuid NOT NULL,
  amount integer NOT NULL CHECK (amount > 0),
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tips visible to sender or receiver" ON public.tips
  FOR SELECT TO authenticated USING (auth.uid() = from_user OR auth.uid() = to_user);

-- NOTIFICATIONS
CREATE TYPE public.notification_kind AS ENUM (
  'follow','like','comment','tip','sale','drop_live','drop_sale'
);

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  actor_id uuid,
  kind public.notification_kind NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_notif_user_created ON public.notifications(user_id, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Helper to insert notif
CREATE OR REPLACE FUNCTION public._notify(_uid uuid, _actor uuid, _kind public.notification_kind, _title text, _body text, _link text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _uid IS NULL OR _uid = _actor THEN RETURN; END IF;
  INSERT INTO public.notifications (user_id, actor_id, kind, title, body, link)
  VALUES (_uid, _actor, _kind, _title, _body, _link);
END; $$;

-- SEND TIP
CREATE OR REPLACE FUNCTION public.send_tip(_to uuid, _amount integer, _message text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _bal integer;
  _from_name text;
  _to_handle text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _uid = _to THEN RAISE EXCEPTION 'Cannot tip yourself'; END IF;
  IF _amount IS NULL OR _amount <= 0 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  IF _amount > 100000 THEN RAISE EXCEPTION 'Amount too large'; END IF;

  SELECT grv_points INTO _bal FROM public.profiles WHERE user_id = _uid FOR UPDATE;
  IF _bal IS NULL OR _bal < _amount THEN RAISE EXCEPTION 'Insufficient GRV'; END IF;

  UPDATE public.profiles SET grv_points = grv_points - _amount WHERE user_id = _uid;
  UPDATE public.profiles SET grv_points = grv_points + _amount WHERE user_id = _to;

  INSERT INTO public.point_transactions (user_id, action, points, description)
  VALUES (_uid, 'tip_sent', -_amount, 'Tip enviado');
  INSERT INTO public.point_transactions (user_id, action, points, description)
  VALUES (_to, 'tip_received', _amount, 'Tip recebido');

  INSERT INTO public.tips (from_user, to_user, amount, message)
  VALUES (_uid, _to, _amount, NULLIF(trim(_message), ''));

  SELECT name INTO _from_name FROM public.profiles WHERE user_id = _uid;
  SELECT handle INTO _to_handle FROM public.profiles WHERE user_id = _to;

  PERFORM public._notify(_to, _uid, 'tip',
    COALESCE(_from_name,'Alguém') || ' te enviou ' || _amount || ' GRV',
    NULLIF(trim(_message), ''),
    CASE WHEN _to_handle IS NOT NULL THEN '/u/' || _to_handle ELSE '/app' END);

  RETURN jsonb_build_object('success', true, 'amount', _amount);
END; $$;

-- TRIGGER: follow notification
CREATE OR REPLACE FUNCTION public._trg_notify_follow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _name text; _handle text;
BEGIN
  SELECT name, handle INTO _name, _handle FROM public.profiles WHERE user_id = NEW.follower_id;
  PERFORM public._notify(NEW.following_id, NEW.follower_id, 'follow',
    COALESCE(_name,'Alguém') || ' começou a te seguir', NULL,
    CASE WHEN _handle IS NOT NULL THEN '/u/' || _handle ELSE '/app/feed' END);
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_follow AFTER INSERT ON public.follows
FOR EACH ROW EXECUTE FUNCTION public._trg_notify_follow();

-- TRIGGER: like notification
CREATE OR REPLACE FUNCTION public._trg_notify_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _author uuid; _name text;
BEGIN
  SELECT user_id INTO _author FROM public.posts WHERE id = NEW.post_id;
  SELECT name INTO _name FROM public.profiles WHERE user_id = NEW.user_id;
  PERFORM public._notify(_author, NEW.user_id, 'like',
    COALESCE(_name,'Alguém') || ' curtiu seu post', NULL, '/app/feed');
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_like AFTER INSERT ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public._trg_notify_like();

-- TRIGGER: comment notification
CREATE OR REPLACE FUNCTION public._trg_notify_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _author uuid; _name text;
BEGIN
  SELECT user_id INTO _author FROM public.posts WHERE id = NEW.post_id;
  SELECT name INTO _name FROM public.profiles WHERE user_id = NEW.user_id;
  PERFORM public._notify(_author, NEW.user_id, 'comment',
    COALESCE(_name,'Alguém') || ' comentou no seu post',
    LEFT(NEW.content, 120), '/app/feed');
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_comment AFTER INSERT ON public.post_comments
FOR EACH ROW EXECUTE FUNCTION public._trg_notify_comment();

-- TRIGGER: item sale
CREATE OR REPLACE FUNCTION public._trg_notify_item_sale()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _name text; _title text;
BEGIN
  SELECT name INTO _name FROM public.profiles WHERE user_id = NEW.user_id;
  SELECT title INTO _title FROM public.artist_items WHERE id = NEW.item_id;
  PERFORM public._notify(NEW.artist_id, NEW.user_id, 'sale',
    'Nova venda: ' || COALESCE(_title,'item'),
    COALESCE(_name,'Um fã') || ' adquiriu por ' || NEW.price_paid || ' GRV',
    '/app/studio/dashboard');
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_item_sale AFTER INSERT ON public.item_claims
FOR EACH ROW EXECUTE FUNCTION public._trg_notify_item_sale();

-- TRIGGER: drop sale
CREATE OR REPLACE FUNCTION public._trg_notify_drop_sale()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _name text; _title text;
BEGIN
  SELECT name INTO _name FROM public.profiles WHERE user_id = NEW.user_id;
  SELECT title INTO _title FROM public.live_drops WHERE id = NEW.drop_id;
  PERFORM public._notify(NEW.artist_id, NEW.user_id, 'drop_sale',
    'Drop resgatado: ' || COALESCE(_title,'drop'),
    COALESCE(_name,'Um fã') || ' garantiu por ' || NEW.price_paid || ' GRV',
    '/app/studio/dashboard');
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_drop_sale AFTER INSERT ON public.live_drop_claims
FOR EACH ROW EXECUTE FUNCTION public._trg_notify_drop_sale();

-- TRIGGER: drop launch -> notify followers
CREATE OR REPLACE FUNCTION public._trg_notify_drop_launch()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _name text; _f record;
BEGIN
  SELECT name INTO _name FROM public.profiles WHERE user_id = NEW.artist_id;
  FOR _f IN SELECT follower_id FROM public.follows WHERE following_id = NEW.artist_id LOOP
    PERFORM public._notify(_f.follower_id, NEW.artist_id, 'drop_live',
      COALESCE(_name,'Artista') || ' lançou um drop: ' || NEW.title,
      'Disponível até ' || to_char(NEW.ends_at, 'DD/MM HH24:MI'),
      '/app/live');
  END LOOP;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_drop_launch AFTER INSERT ON public.live_drops
FOR EACH ROW EXECUTE FUNCTION public._trg_notify_drop_launch();

-- READ ALL
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.notifications SET read = true WHERE user_id = _uid AND read = false;
  RETURN jsonb_build_object('success', true);
END; $$;
