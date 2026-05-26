CREATE OR REPLACE FUNCTION public.record_oracle_sync(
  _uid uuid, _score numeric, _insight text, _profile text, _trigger text, _metrics jsonb,
  _rank text DEFAULT NULL::text, _external jsonb DEFAULT '{}'::jsonb,
  _tx_hash text DEFAULT NULL::text, _slot bigint DEFAULT NULL::bigint,
  _explorer_url text DEFAULT NULL::text, _oracle_hash text DEFAULT NULL::text,
  _chain text DEFAULT 'simulated'::text
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  _hash text := COALESCE(_tx_hash, '0x' || encode(extensions.gen_random_bytes(20), 'hex'));
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

-- Also fix the older overload that has the same bug
CREATE OR REPLACE FUNCTION public.record_oracle_sync(
  _uid uuid, _score numeric, _insight text, _profile text, _trigger text, _metrics jsonb
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  _hash text := '0x' || encode(extensions.gen_random_bytes(20), 'hex');
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
END $function$;