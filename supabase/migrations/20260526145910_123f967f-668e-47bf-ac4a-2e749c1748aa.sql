CREATE OR REPLACE FUNCTION public.get_dashboard_data()
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _profile jsonb;
  _wallet jsonb;
  _missions jsonb;
  _boosts jsonb;
  _crates jsonb;
  _badges jsonb;
  _ranking jsonb;
  _nfts jsonb;
  _oracle jsonb;
  _feed jsonb;
  _artists jsonb;
  _grv integer;
  _ptype public.profile_type;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  _profile := public.create_or_sync_profile();
  _grv := COALESCE((_profile ->> 'grv_points')::integer, 2000);
  _ptype := COALESCE((_profile ->> 'profile_type')::public.profile_type, 'fan'::public.profile_type);

  SELECT jsonb_build_object(
    'balance', _grv,
    'symbol', 'GRV',
    'mode', 'BETA',
    'last_transactions', COALESCE(jsonb_agg(jsonb_build_object(
      'id', id,
      'action', action,
      'points', points,
      'description', description,
      'created_at', created_at
    ) ORDER BY created_at DESC), '[]'::jsonb)
  ) INTO _wallet
  FROM (
    SELECT id, action, points, description, created_at
    FROM public.point_transactions
    WHERE user_id = _uid
    ORDER BY created_at DESC
    LIMIT 8
  ) tx;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'mission_key', mission_key,
    'completed', completed,
    'completed_at', completed_at,
    'created_at', created_at
  ) ORDER BY created_at ASC), '[]'::jsonb) INTO _missions
  FROM public.user_missions
  WHERE user_id = _uid;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', id,
    'slug', slug,
    'name', name,
    'effect', effect,
    'icon', icon,
    'rarity', rarity,
    'expires_at', expires_at,
    'created_at', created_at
  ) ORDER BY expires_at ASC), '[]'::jsonb) INTO _boosts
  FROM public.user_boosts
  WHERE user_id = _uid AND expires_at > now();

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', id,
    'crate_slug', crate_slug,
    'crate_name', crate_name,
    'cost_paid', cost_paid,
    'prize_rarity', prize_rarity,
    'prize_type', prize_type,
    'prize_name', prize_name,
    'prize_icon', prize_icon,
    'prize_grv', prize_grv,
    'created_at', created_at
  ) ORDER BY created_at DESC), '[]'::jsonb) INTO _crates
  FROM (
    SELECT * FROM public.crate_openings
    WHERE user_id = _uid
    ORDER BY created_at DESC
    LIMIT 8
  ) c;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', b.id,
    'slug', b.slug,
    'title', b.title,
    'description', b.description,
    'icon', b.icon,
    'rarity', b.rarity,
    'burned_grv', ub.burned_grv,
    'earned_at', ub.created_at
  ) ORDER BY ub.created_at DESC), '[]'::jsonb) INTO _badges
  FROM public.user_badges ub
  JOIN public.badges b ON b.id = ub.badge_id
  WHERE ub.user_id = _uid;

  SELECT jsonb_build_object(
    'position', COALESCE((SELECT count(*) + 1 FROM public.profiles p WHERE p.grv_points > _grv), 1),
    'top', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'user_id', r.user_id,
        'username', r.name,
        'avatar_url', r.photo_url,
        'level', r.level,
        'grv_balance', r.grv_points,
        'profile_type', r.profile_type
      ) ORDER BY r.grv_points DESC)
      FROM (
        SELECT user_id, name, photo_url, level, grv_points, profile_type
        FROM public.profiles
        ORDER BY grv_points DESC
        LIMIT 5
      ) r
    ), '[]'::jsonb)
  ) INTO _ranking;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', item_id,
    'title', title,
    'artist_id', artist_id,
    'price_grv', price_grv,
    'rarity', rarity,
    'image_url', image_url,
    'source', source,
    'claimed_at', claimed_at
  ) ORDER BY claimed_at DESC), '[]'::jsonb) INTO _nfts
  FROM (
    SELECT ic.item_id, ai.title, ai.artist_id, ai.price_grv,
      CASE
        WHEN ai.supply <= 10 THEN 'legendary'
        WHEN ai.supply <= 50 THEN 'epic'
        WHEN ai.supply <= 250 THEN 'rare'
        ELSE 'common'
      END AS rarity,
      ai.image_url,
      'artist_item' AS source,
      ic.created_at AS claimed_at
    FROM public.item_claims ic
    JOIN public.artist_items ai ON ai.id = ic.item_id
    WHERE ic.user_id = _uid
    UNION ALL
    SELECT ldc.drop_id, ld.title, ld.artist_id, ld.price_grv,
      CASE
        WHEN ld.supply <= 10 THEN 'legendary'
        WHEN ld.supply <= 50 THEN 'epic'
        WHEN ld.supply <= 250 THEN 'rare'
        ELSE 'common'
      END AS rarity,
      ld.image_url,
      'live_drop' AS source,
      ldc.created_at AS claimed_at
    FROM public.live_drop_claims ldc
    JOIN public.live_drops ld ON ld.id = ldc.drop_id
    WHERE ldc.user_id = _uid
  ) n;

  IF jsonb_array_length(_nfts) = 0 THEN
    _nfts := jsonb_build_array(
      jsonb_build_object('id', 'demo-genesis-pass', 'title', 'Groovium Genesis Pass', 'artist_id', null, 'price_grv', 4200, 'rarity', 'legendary', 'image_url', null, 'source', 'demo', 'claimed_at', now()),
      jsonb_build_object('id', 'demo-neon-fan', 'title', 'Neon Fan Badge', 'artist_id', null, 'price_grv', 650, 'rarity', 'rare', 'image_url', null, 'source', 'demo', 'claimed_at', now())
    );
  END IF;

  SELECT public.get_oracle_dashboard() INTO _oracle;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', id,
    'user_name', user_name,
    'user_level', user_level,
    'action', action,
    'points', points,
    'description', description,
    'created_at', created_at,
    'tx_hash', tx_hash
  ) ORDER BY created_at DESC), '[]'::jsonb) INTO _feed
  FROM public.get_explorer_feed(8, NULL);

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'user_id', user_id,
    'username', name,
    'handle', handle,
    'avatar_url', photo_url,
    'bio', bio,
    'grv_balance', grv_points,
    'genres', selected_genres
  ) ORDER BY grv_points DESC), '[]'::jsonb) INTO _artists
  FROM (
    SELECT user_id, name, handle, photo_url, bio, grv_points, selected_genres
    FROM public.profiles
    WHERE profile_type = 'musician'::public.profile_type
    ORDER BY grv_points DESC
    LIMIT 6
  ) a;

  RETURN jsonb_build_object(
    'profile', _profile,
    'wallet', _wallet,
    'missions', _missions,
    'boosts', CASE WHEN jsonb_array_length(_boosts) = 0 THEN jsonb_build_array(
      jsonb_build_object('id', 'demo-xp', 'slug', 'xp_booster', 'name', 'XP Booster', 'effect', '+20% XP em missões', 'icon', '⚡', 'rarity', 'rare', 'expires_at', now() + interval '2 hours'),
      jsonb_build_object('id', 'demo-oracle', 'slug', 'oracle_signal', 'name', 'Oracle Signal', 'effect', 'CRE sync priority', 'icon', '🔗', 'rarity', 'epic', 'expires_at', now() + interval '6 hours')
    ) ELSE _boosts END,
    'crates', CASE WHEN jsonb_array_length(_crates) = 0 THEN jsonb_build_array(
      jsonb_build_object('id', 'demo-crate-1', 'crate_slug', 'neon', 'crate_name', 'Neon Crate', 'cost_paid', 250, 'prize_rarity', 'rare', 'prize_type', 'boost', 'prize_name', 'XP Booster', 'prize_icon', '⚡', 'prize_grv', 0, 'created_at', now()),
      jsonb_build_object('id', 'demo-crate-2', 'crate_slug', 'wave', 'crate_name', 'Wave Crate', 'cost_paid', 800, 'prize_rarity', 'epic', 'prize_type', 'nft', 'prize_name', 'Groove Access', 'prize_icon', '🎫', 'prize_grv', 0, 'created_at', now())
    ) ELSE _crates END,
    'badges', _badges,
    'ranking', _ranking,
    'nft_holdings', _nfts,
    'oracle', _oracle,
    'feed', CASE WHEN jsonb_array_length(_feed) = 0 THEN jsonb_build_array(
      jsonb_build_object('id', 'demo-feed-1', 'user_name', 'Luna Vortex', 'user_level', 'Backstage', 'action', 'live_drop_sale', 'points', 900, 'description', 'Drop ao vivo: Neon Backstage', 'created_at', now(), 'tx_hash', '0xcrefeed001'),
      jsonb_build_object('id', 'demo-feed-2', 'user_name', 'DJ Prisma', 'user_level', 'Insider', 'action', 'nft_mint', 'points', 420, 'description', 'Mintou Groovium Genesis Pass', 'created_at', now(), 'tx_hash', '0xcrefeed002')
    ) ELSE _feed END,
    'artists', CASE WHEN jsonb_array_length(_artists) = 0 THEN jsonb_build_array(
      jsonb_build_object('user_id', 'demo-artist-luna', 'username', 'Luna Vortex', 'handle', 'lunavortex', 'avatar_url', null, 'bio', 'Synthwave BR conectando fãs via GRV.', 'grv_balance', 18420, 'genres', ARRAY['Synthwave','Pop']::text[]),
      jsonb_build_object('user_id', 'demo-artist-prisma', 'username', 'DJ Prisma', 'handle', 'djprisma', 'avatar_url', null, 'bio', 'Drops neon, beats urbanos e experiências secretas.', 'grv_balance', 12770, 'genres', ARRAY['Electronic','Funk']::text[])
    ) ELSE _artists END,
    'is_demo_fallback', jsonb_build_object(
      'boosts', jsonb_array_length(_boosts) = 0,
      'crates', jsonb_array_length(_crates) = 0,
      'feed', jsonb_array_length(_feed) = 0,
      'artists', jsonb_array_length(_artists) = 0
    )
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_dashboard_data() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_dashboard_data() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_data() TO service_role;