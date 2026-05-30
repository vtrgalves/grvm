
-- Fase 1.5 — Oracle consolidation

-- 1) Link smart_actions to oracle syncs
ALTER TABLE public.smart_actions
  ADD COLUMN IF NOT EXISTS sync_id uuid REFERENCES public.oracle_activity(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_smart_actions_sync ON public.smart_actions(sync_id);

-- 2) Extend derivation map (premium proofs)
CREATE OR REPLACE FUNCTION public._derive_smart_action(_action text, _points integer, _desc text)
RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE _action
    WHEN 'mission_complete'    THEN jsonb_build_object('label','Missão concluída','icon','⚡','category','engagement','reputation_delta',15,'premium',false)
    WHEN 'daily_checkin'       THEN jsonb_build_object('label','Check-in diário','icon','🔥','category','engagement','reputation_delta',8,'premium',false)
    WHEN 'post_create'         THEN jsonb_build_object('label','Publicação no feed','icon','📡','category','social','reputation_delta',6,'premium',false)
    WHEN 'post_like'           THEN jsonb_build_object('label','Curtida','icon','❤️','category','social','reputation_delta',2,'premium',false)
    WHEN 'post_comment'        THEN jsonb_build_object('label','Comentário','icon','💬','category','social','reputation_delta',5,'premium',false)
    WHEN 'follow_artist'       THEN jsonb_build_object('label','Seguiu artista','icon','🎧','category','social','reputation_delta',10,'premium',false)
    WHEN 'crate_open'          THEN jsonb_build_object('label','Abriu Crate','icon','🎁','category','collector','reputation_delta',8,'premium',false)
    WHEN 'crate_prize'         THEN jsonb_build_object('label','Prêmio de Crate','icon','💎','category','collector','reputation_delta',12,'premium',false)
    WHEN 'item_purchase'       THEN jsonb_build_object('label','NFT adquirido','icon','🪩','category','support','reputation_delta',32,'premium',true)
    WHEN 'item_sale'           THEN jsonb_build_object('label','Venda de item','icon','💸','category','creator','reputation_delta',25,'premium',true)
    WHEN 'vip_claim'           THEN jsonb_build_object('label','Resgate VIP','icon','👑','category','support','reputation_delta',40,'premium',true)
    WHEN 'badge_burn'          THEN jsonb_build_object('label','Burn de Badge','icon','🔥','category','collector','reputation_delta',45,'premium',true)
    WHEN 'signup_bonus'        THEN jsonb_build_object('label','Boas-vindas Groovium','icon','🌟','category','engagement','reputation_delta',5,'premium',false)
    WHEN 'tip_sent'            THEN jsonb_build_object('label','Tip enviado','icon','💸','category','support','reputation_delta',20,'premium',true)
    WHEN 'oracle_sync'         THEN jsonb_build_object('label','Oracle Sync','icon','🔗','category','meta','reputation_delta',5,'premium',false)
    WHEN 'boost_activate'      THEN jsonb_build_object('label','Boost ativado','icon','⚡','category','engagement','reputation_delta',12,'premium',false)
    WHEN 'nft_mint'            THEN jsonb_build_object('label','NFT cunhado','icon','🪩','category','collector','reputation_delta',50,'premium',true)
    WHEN 'legendary_crate'     THEN jsonb_build_object('label','Crate Lendária','icon','🏆','category','collector','reputation_delta',60,'premium',true)
    WHEN 'genesis_crate'       THEN jsonb_build_object('label','Crate Genesis','icon','🌌','category','collector','reputation_delta',90,'premium',true)
    WHEN 'badge_unlock'        THEN jsonb_build_object('label','Badge desbloqueada','icon','🏅','category','collector','reputation_delta',35,'premium',true)
    WHEN 'rank_unlock'         THEN jsonb_build_object('label','Novo Rank conquistado','icon','🚀','category','meta','reputation_delta',50,'premium',true)
    WHEN 'genesis_achievement' THEN jsonb_build_object('label','Genesis Icon','icon','👁️','category','meta','reputation_delta',120,'premium',true)
    WHEN 'experience_redeem'   THEN jsonb_build_object('label','Experiência Premium resgatada','icon','🎟️','category','support','reputation_delta',70,'premium',true)
    ELSE                         jsonb_build_object(
      'label', upper(replace(_action,'_',' ')),
      'icon','🔹','category','engagement',
      'reputation_delta', GREATEST(0, LEAST(20, abs(COALESCE(_points,0))/20))::int,
      'premium', false
    )
  END;
$$;

-- 3) Trigger: crate_openings → premium proofs for legendary/genesis or NFT prizes
CREATE OR REPLACE FUNCTION public._trg_smart_action_from_crate()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _action text; _label text; _icon text; _rep int;
BEGIN
  IF NEW.prize_rarity = 'genesis' THEN
    _action := 'genesis_crate'; _label := 'Genesis Crate · ' || NEW.prize_name; _icon := '🌌'; _rep := 90;
  ELSIF NEW.prize_rarity = 'legendary' THEN
    _action := 'legendary_crate'; _label := 'Legendary Crate · ' || NEW.prize_name; _icon := '🏆'; _rep := 60;
  ELSIF NEW.prize_type = 'nft' THEN
    _action := 'nft_mint'; _label := 'NFT cunhado · ' || NEW.prize_name; _icon := '🪩'; _rep := 50;
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.smart_actions (
    user_id, action, category, label, icon, points, reputation_delta, premium, metadata
  ) VALUES (
    NEW.user_id, _action, 'collector', _label, _icon,
    NEW.prize_grv, _rep, true,
    jsonb_build_object('crate_slug', NEW.crate_slug, 'rarity', NEW.prize_rarity, 'prize', NEW.prize_name, 'opening_id', NEW.id)
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_smart_action_from_crate ON public.crate_openings;
CREATE TRIGGER trg_smart_action_from_crate
  AFTER INSERT ON public.crate_openings
  FOR EACH ROW EXECUTE FUNCTION public._trg_smart_action_from_crate();

-- 4) Trigger: user_badges → badge_unlock premium proof
CREATE OR REPLACE FUNCTION public._trg_smart_action_from_badge()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _b record;
BEGIN
  SELECT title, icon, rarity INTO _b FROM public.badges WHERE id = NEW.badge_id;
  INSERT INTO public.smart_actions (
    user_id, action, category, label, icon, points, reputation_delta, premium, metadata
  ) VALUES (
    NEW.user_id, 'badge_unlock', 'collector',
    'Badge desbloqueada · ' || COALESCE(_b.title,'Badge'),
    COALESCE(_b.icon,'🏅'),
    0, 35, true,
    jsonb_build_object('badge_id', NEW.badge_id, 'rarity', _b.rarity, 'burned_grv', NEW.burned_grv)
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_smart_action_from_badge ON public.user_badges;
CREATE TRIGGER trg_smart_action_from_badge
  AFTER INSERT ON public.user_badges
  FOR EACH ROW EXECUTE FUNCTION public._trg_smart_action_from_badge();

-- 5) Trigger: oracle_activity insert → attach pending non-premium actions to this sync
CREATE OR REPLACE FUNCTION public._trg_attach_actions_to_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.smart_actions
     SET sync_id = NEW.id
   WHERE user_id = NEW.user_id
     AND sync_id IS NULL
     AND premium = false
     AND created_at <= NEW.created_at;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_attach_actions_to_sync ON public.oracle_activity;
CREATE TRIGGER trg_attach_actions_to_sync
  AFTER INSERT ON public.oracle_activity
  FOR EACH ROW EXECUTE FUNCTION public._trg_attach_actions_to_sync();

-- 6) Read RPCs
CREATE OR REPLACE FUNCTION public.get_smart_actions_by_sync(_sync_id uuid)
RETURNS TABLE(
  id uuid, action text, label text, icon text, category text,
  points integer, reputation_delta integer, premium boolean,
  tx_hash text, explorer_url text, chain text, created_at timestamptz
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.action, s.label, s.icon, s.category,
         s.points, s.reputation_delta, s.premium,
         s.tx_hash, s.explorer_url, s.chain, s.created_at
  FROM public.smart_actions s
  WHERE s.sync_id = _sync_id
    AND (s.user_id = auth.uid()
         OR EXISTS (SELECT 1 FROM public.oracle_activity o WHERE o.id = _sync_id))
  ORDER BY s.created_at ASC
  LIMIT 200;
$$;

-- 7) Premium proofs visible to the user (no service_role restriction)
CREATE OR REPLACE FUNCTION public.get_user_premium_proofs(_limit integer DEFAULT 50)
RETURNS TABLE(
  id uuid, action text, label text, icon text, points integer,
  reputation_delta integer, oracle_synced boolean,
  tx_hash text, explorer_url text, chain text, created_at timestamptz
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, action, label, icon, points, reputation_delta, oracle_synced,
         tx_hash, explorer_url, chain, created_at
  FROM public.smart_actions
  WHERE user_id = auth.uid() AND premium = true
  ORDER BY created_at DESC
  LIMIT LEAST(COALESCE(_limit,50), 200);
$$;

-- 8) Explorer: counts per sync (for the new Explorer tab)
CREATE OR REPLACE FUNCTION public.get_oracle_sync_feed(_limit integer DEFAULT 30)
RETURNS TABLE(
  id uuid, user_id uuid, user_name text,
  groove_score numeric, ai_rank text, ai_profile text,
  chain text, tx_hash text, explorer_url text,
  actions_count integer, premium_count integer,
  created_at timestamptz
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT o.id, o.user_id, COALESCE(p.name,'Anônimo'),
         o.groove_score, o.ai_rank, o.ai_profile,
         o.chain, o.tx_hash, o.explorer_url,
         COALESCE((SELECT COUNT(*)::int FROM public.smart_actions s WHERE s.sync_id = o.id), 0),
         COALESCE((SELECT COUNT(*)::int FROM public.smart_actions s WHERE s.sync_id = o.id AND s.premium = true), 0),
         o.created_at
  FROM public.oracle_activity o
  LEFT JOIN public.profiles p ON p.user_id = o.user_id
  ORDER BY o.created_at DESC
  LIMIT LEAST(COALESCE(_limit,30), 100);
$$;
