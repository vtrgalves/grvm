
-- 1. Service config (stores Solana service wallet, only service_role)
CREATE TABLE IF NOT EXISTS public.service_config (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.service_config FROM anon, authenticated;
GRANT ALL ON public.service_config TO service_role;
ALTER TABLE public.service_config ENABLE ROW LEVEL SECURITY;
-- No policies = only service_role bypasses RLS.

-- 2. New columns on oracle_activity
ALTER TABLE public.oracle_activity
  ADD COLUMN IF NOT EXISTS chain text DEFAULT 'simulated',
  ADD COLUMN IF NOT EXISTS explorer_url text,
  ADD COLUMN IF NOT EXISTS oracle_hash text,
  ADD COLUMN IF NOT EXISTS slot bigint;

-- 3. Updated record_oracle_sync with Solana proof fields
CREATE OR REPLACE FUNCTION public.record_oracle_sync(
  _uid uuid,
  _score numeric,
  _insight text,
  _profile text,
  _trigger text,
  _metrics jsonb,
  _rank text DEFAULT NULL,
  _external jsonb DEFAULT '{}'::jsonb,
  _tx_hash text DEFAULT NULL,
  _slot bigint DEFAULT NULL,
  _explorer_url text DEFAULT NULL,
  _oracle_hash text DEFAULT NULL,
  _chain text DEFAULT 'simulated'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _hash text := COALESCE(_tx_hash, '0x' || encode(gen_random_bytes(20), 'hex'));
  _block bigint := COALESCE(_slot, 18000000 + floor(random() * 1000000)::bigint);
  _id uuid;
BEGIN
  INSERT INTO public.oracle_activity (
    user_id, groove_score, ai_insight, ai_profile, ai_rank,
    tx_hash, block_number, slot, chain, explorer_url, oracle_hash,
    trigger_event, workflow_status, external_data
  ) VALUES (
    _uid, COALESCE(_score, 0),
    COALESCE(_insight, 'Seu perfil ainda possui poucos dados para análise avançada.'),
    COALESCE(_profile, 'Groover Rookie'),
    COALESCE(_rank, 'Rookie'),
    _hash, _block, _slot, COALESCE(_chain, 'simulated'), _explorer_url, _oracle_hash,
    COALESCE(_trigger, 'manual_sync'), 'SUCCESS', COALESCE(_external, '{}'::jsonb)
  ) RETURNING id INTO _id;

  INSERT INTO public.engagement_metrics (
    user_id, missions_completed, nft_count, grv_balance, streak,
    boosts_active, interactions_total, updated_at
  ) VALUES (
    _uid,
    COALESCE((_metrics->>'missions_completed')::int, 0),
    COALESCE((_metrics->>'nft_count')::int, 0),
    COALESCE((_metrics->>'grv_balance')::int, 0),
    COALESCE((_metrics->>'streak')::int, 0),
    COALESCE((_metrics->>'boosts_active')::int, 0),
    COALESCE((_metrics->>'follows')::int, 0) + COALESCE((_metrics->>'likes')::int, 0) + COALESCE((_metrics->>'comments')::int, 0),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    missions_completed = EXCLUDED.missions_completed,
    nft_count = EXCLUDED.nft_count,
    grv_balance = EXCLUDED.grv_balance,
    streak = EXCLUDED.streak,
    boosts_active = EXCLUDED.boosts_active,
    interactions_total = EXCLUDED.interactions_total,
    updated_at = now();

  RETURN jsonb_build_object(
    'id', _id, 'tx_hash', _hash, 'block_number', _block,
    'slot', _slot, 'chain', COALESCE(_chain, 'simulated'),
    'explorer_url', _explorer_url, 'oracle_hash', _oracle_hash
  );
END;
$function$;

-- 4. Updated get_oracle_dashboard to expose the new fields
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

  SELECT * INTO _latest FROM public.oracle_activity WHERE user_id = _uid ORDER BY created_at DESC LIMIT 1;
  SELECT * INTO _metrics FROM public.engagement_metrics WHERE user_id = _uid;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', id, 'score', groove_score, 'insight', ai_insight, 'rank', ai_rank,
    'tx_hash', tx_hash, 'block_number', block_number, 'slot', slot,
    'chain', chain, 'explorer_url', explorer_url, 'oracle_hash', oracle_hash,
    'trigger_event', trigger_event, 'created_at', created_at
  ) ORDER BY created_at DESC), '[]'::jsonb) INTO _history
  FROM (SELECT * FROM public.oracle_activity WHERE user_id = _uid ORDER BY created_at DESC LIMIT 8) o;

  RETURN jsonb_build_object(
    'latest', CASE WHEN _latest IS NULL THEN NULL ELSE jsonb_build_object(
      'groove_score', _latest.groove_score, 'ai_insight', _latest.ai_insight,
      'ai_profile', _latest.ai_profile, 'ai_rank', _latest.ai_rank,
      'tx_hash', _latest.tx_hash, 'block_number', _latest.block_number,
      'slot', _latest.slot, 'chain', _latest.chain,
      'explorer_url', _latest.explorer_url, 'oracle_hash', _latest.oracle_hash,
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
END;
$function$;
