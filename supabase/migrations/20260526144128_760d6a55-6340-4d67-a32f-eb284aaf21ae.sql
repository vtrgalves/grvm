
-- engagement_metrics table
CREATE TABLE public.engagement_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  missions_completed integer NOT NULL DEFAULT 0,
  nft_count integer NOT NULL DEFAULT 0,
  grv_balance integer NOT NULL DEFAULT 0,
  streak integer NOT NULL DEFAULT 0,
  boosts_active integer NOT NULL DEFAULT 0,
  interactions_total integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.engagement_metrics TO authenticated;
GRANT ALL ON public.engagement_metrics TO service_role;
ALTER TABLE public.engagement_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own metrics" ON public.engagement_metrics
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- oracle_activity table
CREATE TABLE public.oracle_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  groove_score numeric(4,2) NOT NULL,
  ai_insight text,
  ai_profile text,
  workflow_status text NOT NULL DEFAULT 'completed',
  tx_hash text NOT NULL,
  block_number bigint,
  trigger_event text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.oracle_activity TO authenticated;
GRANT ALL ON public.oracle_activity TO service_role;
ALTER TABLE public.oracle_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own oracle activity" ON public.oracle_activity
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_oracle_activity_user ON public.oracle_activity(user_id, created_at DESC);

-- Compute metrics from existing tables (called by edge function)
CREATE OR REPLACE FUNCTION public.compute_engagement_metrics(_uid uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _m jsonb;
BEGIN
  SELECT jsonb_build_object(
    'missions_completed', COALESCE((SELECT count(*) FROM user_missions WHERE user_id = _uid AND completed), 0),
    'nft_count', COALESCE((SELECT count(*) FROM item_claims WHERE user_id = _uid), 0)
                + COALESCE((SELECT count(*) FROM live_drop_claims WHERE user_id = _uid), 0),
    'grv_balance', COALESCE((SELECT grv_points FROM profiles WHERE user_id = _uid), 0),
    'streak', COALESCE((SELECT streak FROM daily_checkins WHERE user_id = _uid ORDER BY day DESC LIMIT 1), 0),
    'boosts_active', COALESCE((SELECT count(*) FROM user_boosts WHERE user_id = _uid AND expires_at > now()), 0),
    'crates_opened', COALESCE((SELECT count(*) FROM crate_openings WHERE user_id = _uid), 0),
    'follows', COALESCE((SELECT count(*) FROM follows WHERE follower_id = _uid), 0),
    'likes', COALESCE((SELECT count(*) FROM post_likes WHERE user_id = _uid), 0),
    'comments', COALESCE((SELECT count(*) FROM post_comments WHERE user_id = _uid), 0),
    'badges', COALESCE((SELECT count(*) FROM user_badges WHERE user_id = _uid), 0),
    'tips_sent', COALESCE((SELECT count(*) FROM tips WHERE from_user = _uid), 0)
  ) INTO _m;
  RETURN _m;
END $$;
REVOKE EXECUTE ON FUNCTION public.compute_engagement_metrics(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.compute_engagement_metrics(uuid) TO authenticated, service_role;

-- Record oracle sync result (called by edge function via service role)
CREATE OR REPLACE FUNCTION public.record_oracle_sync(
  _uid uuid, _score numeric, _insight text, _profile text,
  _trigger text, _metrics jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _hash text := '0x' || encode(gen_random_bytes(20), 'hex');
  _block bigint := 18000000 + floor(random() * 1000000)::bigint;
  _id uuid;
BEGIN
  INSERT INTO oracle_activity (user_id, groove_score, ai_insight, ai_profile, tx_hash, block_number, trigger_event)
  VALUES (_uid, _score, _insight, _profile, _hash, _block, _trigger)
  RETURNING id INTO _id;

  INSERT INTO engagement_metrics (user_id, missions_completed, nft_count, grv_balance, streak, boosts_active, interactions_total, updated_at)
  VALUES (_uid,
    COALESCE((_metrics->>'missions_completed')::int, 0),
    COALESCE((_metrics->>'nft_count')::int, 0),
    COALESCE((_metrics->>'grv_balance')::int, 0),
    COALESCE((_metrics->>'streak')::int, 0),
    COALESCE((_metrics->>'boosts_active')::int, 0),
    COALESCE((_metrics->>'follows')::int, 0) + COALESCE((_metrics->>'likes')::int, 0) + COALESCE((_metrics->>'comments')::int, 0),
    now())
  ON CONFLICT (user_id) DO UPDATE SET
    missions_completed = EXCLUDED.missions_completed,
    nft_count = EXCLUDED.nft_count,
    grv_balance = EXCLUDED.grv_balance,
    streak = EXCLUDED.streak,
    boosts_active = EXCLUDED.boosts_active,
    interactions_total = EXCLUDED.interactions_total,
    updated_at = now();

  RETURN jsonb_build_object('id', _id, 'tx_hash', _hash, 'block_number', _block);
END $$;
REVOKE EXECUTE ON FUNCTION public.record_oracle_sync(uuid, numeric, text, text, text, jsonb) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.record_oracle_sync(uuid, numeric, text, text, text, jsonb) TO service_role;

-- Dashboard reader
CREATE OR REPLACE FUNCTION public.get_oracle_dashboard()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _latest RECORD;
  _metrics RECORD;
  _history jsonb;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO _latest FROM oracle_activity WHERE user_id = _uid ORDER BY created_at DESC LIMIT 1;
  SELECT * INTO _metrics FROM engagement_metrics WHERE user_id = _uid;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', id, 'score', groove_score, 'insight', ai_insight,
    'tx_hash', tx_hash, 'block_number', block_number,
    'trigger_event', trigger_event, 'created_at', created_at
  ) ORDER BY created_at DESC), '[]'::jsonb) INTO _history
  FROM (SELECT * FROM oracle_activity WHERE user_id = _uid ORDER BY created_at DESC LIMIT 8) o;

  RETURN jsonb_build_object(
    'latest', CASE WHEN _latest IS NULL THEN NULL ELSE jsonb_build_object(
      'groove_score', _latest.groove_score, 'ai_insight', _latest.ai_insight,
      'ai_profile', _latest.ai_profile, 'tx_hash', _latest.tx_hash,
      'block_number', _latest.block_number, 'workflow_status', _latest.workflow_status,
      'created_at', _latest.created_at
    ) END,
    'metrics', CASE WHEN _metrics IS NULL THEN NULL ELSE jsonb_build_object(
      'missions_completed', _metrics.missions_completed, 'nft_count', _metrics.nft_count,
      'grv_balance', _metrics.grv_balance, 'streak', _metrics.streak,
      'boosts_active', _metrics.boosts_active, 'interactions_total', _metrics.interactions_total,
      'updated_at', _metrics.updated_at
    ) END,
    'history', _history
  );
END $$;
REVOKE EXECUTE ON FUNCTION public.get_oracle_dashboard() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_oracle_dashboard() TO authenticated;
