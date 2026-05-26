
-- Ensure pgcrypto for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Widen groove_score to support 0-1000 range
ALTER TABLE public.oracle_activity ALTER COLUMN groove_score TYPE numeric(7,2);

-- Add ai_rank and external_data columns
ALTER TABLE public.oracle_activity ADD COLUMN IF NOT EXISTS ai_rank text;
ALTER TABLE public.oracle_activity ADD COLUMN IF NOT EXISTS external_data jsonb DEFAULT '{}'::jsonb;

-- Recreate record_oracle_sync with safe hash + ai_rank + external_data
CREATE OR REPLACE FUNCTION public.record_oracle_sync(
  _uid uuid,
  _score numeric,
  _insight text,
  _profile text,
  _trigger text,
  _metrics jsonb,
  _rank text DEFAULT NULL,
  _external jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _hash text := '0x' || encode(public.gen_random_bytes(20), 'hex');
  _block bigint := 18000000 + floor(random() * 1000000)::bigint;
  _id uuid;
BEGIN
  INSERT INTO oracle_activity (
    user_id, groove_score, ai_insight, ai_profile, ai_rank, tx_hash, block_number, trigger_event, external_data
  )
  VALUES (_uid, _score, _insight, _profile, _rank, _hash, _block, _trigger, COALESCE(_external, '{}'::jsonb))
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
END $function$;

REVOKE EXECUTE ON FUNCTION public.record_oracle_sync(uuid, numeric, text, text, text, jsonb, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_oracle_sync(uuid, numeric, text, text, text, jsonb, text, jsonb) TO service_role;

-- Update dashboard view to include ai_rank + external_data
CREATE OR REPLACE FUNCTION public.get_oracle_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    'id', id, 'score', groove_score, 'insight', ai_insight, 'rank', ai_rank,
    'tx_hash', tx_hash, 'block_number', block_number,
    'trigger_event', trigger_event, 'created_at', created_at
  ) ORDER BY created_at DESC), '[]'::jsonb) INTO _history
  FROM (SELECT * FROM oracle_activity WHERE user_id = _uid ORDER BY created_at DESC LIMIT 8) o;

  RETURN jsonb_build_object(
    'latest', CASE WHEN _latest IS NULL THEN NULL ELSE jsonb_build_object(
      'groove_score', _latest.groove_score, 'ai_insight', _latest.ai_insight,
      'ai_profile', _latest.ai_profile, 'ai_rank', _latest.ai_rank,
      'tx_hash', _latest.tx_hash, 'block_number', _latest.block_number,
      'workflow_status', _latest.workflow_status, 'external_data', _latest.external_data,
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
END $function$;

REVOKE EXECUTE ON FUNCTION public.get_oracle_dashboard() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_oracle_dashboard() TO authenticated;
