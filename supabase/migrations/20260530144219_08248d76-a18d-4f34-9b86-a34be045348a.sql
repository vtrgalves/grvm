-- Drop incompatible signature first
DROP FUNCTION IF EXISTS public.get_smart_actions(integer);

-- 1. Table
CREATE TABLE IF NOT EXISTS public.smart_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source_tx_id uuid UNIQUE,
  action text NOT NULL,
  category text NOT NULL DEFAULT 'engagement',
  label text NOT NULL,
  icon text NOT NULL DEFAULT '⚡',
  points integer NOT NULL DEFAULT 0,
  reputation_delta integer NOT NULL DEFAULT 0,
  premium boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  oracle_synced boolean NOT NULL DEFAULT false,
  tx_hash text,
  explorer_url text,
  chain text DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_smart_actions_user ON public.smart_actions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_smart_actions_global ON public.smart_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_smart_actions_premium_pending
  ON public.smart_actions(premium, oracle_synced)
  WHERE premium = true AND oracle_synced = false;

GRANT SELECT ON public.smart_actions TO authenticated;
GRANT ALL ON public.smart_actions TO service_role;

ALTER TABLE public.smart_actions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='smart_actions' AND policyname='Smart actions viewable by authenticated') THEN
    CREATE POLICY "Smart actions viewable by authenticated"
      ON public.smart_actions FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- 2. Derivation function
CREATE OR REPLACE FUNCTION public._derive_smart_action(_action text, _points integer, _desc text)
RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE _action
    WHEN 'mission_complete' THEN jsonb_build_object('label','Missão concluída','icon','⚡','category','engagement','reputation_delta',15,'premium',false)
    WHEN 'daily_checkin'    THEN jsonb_build_object('label','Check-in diário','icon','🔥','category','engagement','reputation_delta',8,'premium',false)
    WHEN 'post_create'      THEN jsonb_build_object('label','Publicação no feed','icon','📡','category','social','reputation_delta',6,'premium',false)
    WHEN 'post_like'        THEN jsonb_build_object('label','Curtida','icon','❤️','category','social','reputation_delta',2,'premium',false)
    WHEN 'post_comment'     THEN jsonb_build_object('label','Comentário','icon','💬','category','social','reputation_delta',5,'premium',false)
    WHEN 'follow_artist'    THEN jsonb_build_object('label','Seguiu artista','icon','🎧','category','social','reputation_delta',10,'premium',false)
    WHEN 'crate_open'       THEN jsonb_build_object('label','Abriu Crate','icon','🎁','category','collector','reputation_delta',8,'premium',false)
    WHEN 'crate_prize'      THEN jsonb_build_object('label','Prêmio de Crate','icon','💎','category','collector','reputation_delta',12,'premium',false)
    WHEN 'item_purchase'    THEN jsonb_build_object('label','Compra de item','icon','🛒','category','support','reputation_delta',32,'premium',true)
    WHEN 'item_sale'        THEN jsonb_build_object('label','Venda de item','icon','💸','category','creator','reputation_delta',25,'premium',true)
    WHEN 'vip_claim'        THEN jsonb_build_object('label','Resgate VIP','icon','👑','category','support','reputation_delta',40,'premium',true)
    WHEN 'badge_burn'       THEN jsonb_build_object('label','Burn de Badge','icon','🔥','category','collector','reputation_delta',45,'premium',true)
    WHEN 'signup_bonus'     THEN jsonb_build_object('label','Boas-vindas Groovium','icon','🌟','category','engagement','reputation_delta',5,'premium',false)
    WHEN 'tip_sent'         THEN jsonb_build_object('label','Tip enviado','icon','💸','category','support','reputation_delta',20,'premium',true)
    WHEN 'oracle_sync'      THEN jsonb_build_object('label','Oracle Sync','icon','🔗','category','meta','reputation_delta',5,'premium',false)
    ELSE                         jsonb_build_object(
      'label', upper(replace(_action,'_',' ')),
      'icon','🔹','category','engagement',
      'reputation_delta', GREATEST(0, LEAST(20, abs(COALESCE(_points,0))/20))::int,
      'premium', false
    )
  END;
$$;

-- 3. Trigger
CREATE OR REPLACE FUNCTION public._trg_smart_action_from_point_tx()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _d jsonb;
BEGIN
  _d := public._derive_smart_action(NEW.action, NEW.points, NEW.description);
  INSERT INTO public.smart_actions (
    user_id, source_tx_id, action, category, label, icon,
    points, reputation_delta, premium, metadata
  ) VALUES (
    NEW.user_id, NEW.id, NEW.action,
    _d->>'category', _d->>'label', _d->>'icon',
    NEW.points, (_d->>'reputation_delta')::int, (_d->>'premium')::boolean,
    jsonb_build_object('description', NEW.description)
  )
  ON CONFLICT (source_tx_id) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_smart_action_from_point_tx ON public.point_transactions;
CREATE TRIGGER trg_smart_action_from_point_tx
  AFTER INSERT ON public.point_transactions
  FOR EACH ROW EXECUTE FUNCTION public._trg_smart_action_from_point_tx();

-- 4. Backfill
INSERT INTO public.smart_actions (
  user_id, source_tx_id, action, category, label, icon,
  points, reputation_delta, premium, metadata, created_at
)
SELECT
  pt.user_id, pt.id, pt.action,
  (public._derive_smart_action(pt.action, pt.points, pt.description))->>'category',
  (public._derive_smart_action(pt.action, pt.points, pt.description))->>'label',
  (public._derive_smart_action(pt.action, pt.points, pt.description))->>'icon',
  pt.points,
  ((public._derive_smart_action(pt.action, pt.points, pt.description))->>'reputation_delta')::int,
  ((public._derive_smart_action(pt.action, pt.points, pt.description))->>'premium')::boolean,
  jsonb_build_object('description', pt.description),
  pt.created_at
FROM public.point_transactions pt
ON CONFLICT (source_tx_id) DO NOTHING;

-- 5. get_smart_actions (new signature with premium)
CREATE FUNCTION public.get_smart_actions(_limit integer DEFAULT 16)
RETURNS TABLE(
  id uuid, action text, description text, points integer,
  created_at timestamptz, label text, icon text,
  reputation_delta integer, category text, premium boolean
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.action, s.metadata->>'description', s.points,
    s.created_at, s.label, s.icon, s.reputation_delta, s.category, s.premium
  FROM public.smart_actions s
  WHERE s.user_id = auth.uid()
  ORDER BY s.created_at DESC
  LIMIT LEAST(COALESCE(_limit, 16), 100);
$$;

-- 6. Reputation Score 0-1000
CREATE OR REPLACE FUNCTION public.compute_reputation_score(_uid uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH agg AS (
    SELECT
      COALESCE(SUM(reputation_delta), 0)::int AS rep_total,
      COUNT(*) FILTER (WHERE created_at > now() - interval '7 days')::int AS recent7,
      COUNT(DISTINCT category)::int AS diversity,
      COUNT(DISTINCT date_trunc('day', created_at))::int AS active_days,
      COUNT(*) FILTER (WHERE premium = true)::int AS premium_count
    FROM public.smart_actions WHERE user_id = _uid
  )
  SELECT GREATEST(0, LEAST(1000, (
    LEAST(rep_total, 1500) + GREATEST(0, rep_total - 1500) / 4
    + LEAST(recent7, 80) * 2
    + LEAST(diversity, 6) * 25
    + LEAST(active_days, 60) * 4
    + LEAST(premium_count, 40) * 8
  )))::int FROM agg;
$$;

-- 7. Global feed
CREATE OR REPLACE FUNCTION public.get_smart_actions_global(
  _limit integer DEFAULT 50, _premium_only boolean DEFAULT false
)
RETURNS TABLE(
  id uuid, user_id uuid, user_name text, action text, label text, icon text,
  category text, points integer, reputation_delta integer, premium boolean,
  tx_hash text, explorer_url text, chain text, created_at timestamptz
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.user_id, COALESCE(p.name, 'Anônimo'), s.action, s.label, s.icon,
    s.category, s.points, s.reputation_delta, s.premium,
    s.tx_hash, s.explorer_url, s.chain, s.created_at
  FROM public.smart_actions s
  LEFT JOIN public.profiles p ON p.user_id = s.user_id
  WHERE (NOT _premium_only OR s.premium = true)
  ORDER BY s.created_at DESC
  LIMIT LEAST(COALESCE(_limit, 50), 200);
$$;

-- 8. Oracle History
CREATE OR REPLACE FUNCTION public.get_oracle_history(_range text DEFAULT 'all')
RETURNS TABLE(
  id uuid, groove_score numeric, ai_insight text, ai_profile text, ai_rank text,
  tx_hash text, block_number bigint, slot bigint, chain text, explorer_url text,
  oracle_hash text, trigger_event text, external_data jsonb, created_at timestamptz
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, groove_score, ai_insight, ai_profile, ai_rank,
    tx_hash, block_number, slot, chain, explorer_url, oracle_hash,
    trigger_event, external_data, created_at
  FROM public.oracle_activity
  WHERE user_id = auth.uid()
    AND CASE _range
      WHEN 'today' THEN created_at >= date_trunc('day', now())
      WHEN 'week'  THEN created_at >= now() - interval '7 days'
      WHEN 'month' THEN created_at >= now() - interval '30 days'
      ELSE true
    END
  ORDER BY created_at DESC
  LIMIT 200;
$$;

-- 9. Premium proof queue (service_role only)
CREATE OR REPLACE FUNCTION public.list_pending_premium_proofs(_limit integer DEFAULT 10)
RETURNS TABLE(id uuid, user_id uuid, action text, label text, points integer, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, user_id, action, label, points, created_at
  FROM public.smart_actions
  WHERE premium = true AND oracle_synced = false
  ORDER BY created_at ASC
  LIMIT LEAST(COALESCE(_limit, 10), 50);
$$;
REVOKE EXECUTE ON FUNCTION public.list_pending_premium_proofs(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.list_pending_premium_proofs(integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_pending_premium_proofs(integer) TO service_role;

CREATE OR REPLACE FUNCTION public.mark_premium_proof(
  _action_id uuid, _tx_hash text, _explorer_url text, _chain text DEFAULT 'solana-devnet'
)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.smart_actions
     SET tx_hash = _tx_hash, explorer_url = _explorer_url,
         chain = COALESCE(_chain,'solana-devnet'), oracle_synced = true
   WHERE id = _action_id;
$$;
REVOKE EXECUTE ON FUNCTION public.mark_premium_proof(uuid, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_premium_proof(uuid, text, text, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_premium_proof(uuid, text, text, text) TO service_role;