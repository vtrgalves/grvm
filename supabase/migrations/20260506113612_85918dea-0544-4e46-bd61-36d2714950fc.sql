
CREATE OR REPLACE FUNCTION public.get_artist_dashboard()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _ptype profile_type;
  _totals jsonb;
  _top_items jsonb;
  _top_fans jsonb;
  _recent jsonb;
  _series jsonb;
  _drops_stats jsonb;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT profile_type INTO _ptype FROM public.profiles WHERE user_id = _uid;
  IF _ptype <> 'musician' THEN RAISE EXCEPTION 'Only artists'; END IF;

  -- Totals: revenue (artist-side incoming GRV from sales), claims count, followers, items
  SELECT jsonb_build_object(
    'revenue_grv', COALESCE((SELECT SUM(points) FROM public.point_transactions
                              WHERE user_id = _uid AND action IN ('item_sale','live_drop_sale')), 0),
    'sales_count', COALESCE((SELECT count(*) FROM public.item_claims WHERE artist_id = _uid), 0)
                  + COALESCE((SELECT count(*) FROM public.live_drop_claims WHERE artist_id = _uid), 0),
    'followers', COALESCE((SELECT count(*) FROM public.follows WHERE following_id = _uid), 0),
    'items_active', COALESCE((SELECT count(*) FROM public.artist_items WHERE artist_id = _uid AND active = true), 0),
    'drops_active', COALESCE((SELECT count(*) FROM public.live_drops WHERE artist_id = _uid AND active = true AND ends_at > now()), 0),
    'sales_24h', COALESCE((SELECT count(*) FROM public.item_claims WHERE artist_id = _uid AND created_at > now() - interval '24 hours'), 0)
                + COALESCE((SELECT count(*) FROM public.live_drop_claims WHERE artist_id = _uid AND created_at > now() - interval '24 hours'), 0),
    'revenue_24h', COALESCE((SELECT SUM(points) FROM public.point_transactions
                              WHERE user_id = _uid AND action IN ('item_sale','live_drop_sale')
                              AND created_at > now() - interval '24 hours'), 0)
  ) INTO _totals;

  -- Top items by claims
  SELECT COALESCE(jsonb_agg(x ORDER BY x.claims DESC), '[]'::jsonb) INTO _top_items FROM (
    SELECT i.id, i.title, i.kind, i.image_url, i.price_grv, i.supply, i.claimed_count AS claims,
           (i.claimed_count * i.price_grv) AS revenue
    FROM public.artist_items i
    WHERE i.artist_id = _uid
    ORDER BY i.claimed_count DESC
    LIMIT 5
  ) x;

  -- Top fans (combined item + drop claims)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'user_id', user_id, 'name', name, 'handle', handle, 'photo_url', photo_url,
    'level', level, 'purchases', purchases, 'spent_grv', spent_grv
  ) ORDER BY spent_grv DESC), '[]'::jsonb) INTO _top_fans FROM (
    SELECT pr.user_id, pr.name, pr.handle, pr.photo_url, pr.level,
           count(*) AS purchases, SUM(price_paid) AS spent_grv
    FROM (
      SELECT user_id, price_paid FROM public.item_claims WHERE artist_id = _uid
      UNION ALL
      SELECT user_id, price_paid FROM public.live_drop_claims WHERE artist_id = _uid
    ) c
    JOIN public.profiles pr ON pr.user_id = c.user_id
    GROUP BY pr.user_id, pr.name, pr.handle, pr.photo_url, pr.level
    ORDER BY spent_grv DESC
    LIMIT 5
  ) f;

  -- Recent activity
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'kind', kind, 'title', title, 'fan_name', fan_name, 'fan_handle', fan_handle,
    'price', price, 'created_at', created_at
  ) ORDER BY created_at DESC), '[]'::jsonb) INTO _recent FROM (
    SELECT 'item' AS kind, i.title, pr.name AS fan_name, pr.handle AS fan_handle,
           ic.price_paid AS price, ic.created_at
    FROM public.item_claims ic
    JOIN public.artist_items i ON i.id = ic.item_id
    LEFT JOIN public.profiles pr ON pr.user_id = ic.user_id
    WHERE ic.artist_id = _uid
    UNION ALL
    SELECT 'drop' AS kind, d.title, pr.name, pr.handle,
           dc.price_paid, dc.created_at
    FROM public.live_drop_claims dc
    JOIN public.live_drops d ON d.id = dc.drop_id
    LEFT JOIN public.profiles pr ON pr.user_id = dc.user_id
    WHERE dc.artist_id = _uid
    ORDER BY created_at DESC
    LIMIT 10
  ) r;

  -- Revenue series (last 14 days)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'day', day, 'revenue', revenue, 'sales', sales
  ) ORDER BY day), '[]'::jsonb) INTO _series FROM (
    SELECT day::date AS day,
      COALESCE((SELECT SUM(points) FROM public.point_transactions
                WHERE user_id = _uid AND action IN ('item_sale','live_drop_sale')
                AND created_at::date = day::date), 0) AS revenue,
      COALESCE((SELECT count(*) FROM (
        SELECT created_at FROM public.item_claims WHERE artist_id = _uid
        UNION ALL
        SELECT created_at FROM public.live_drop_claims WHERE artist_id = _uid
      ) c WHERE c.created_at::date = day::date), 0) AS sales
    FROM generate_series(now()::date - interval '13 days', now()::date, interval '1 day') AS day
  ) s;

  RETURN jsonb_build_object(
    'totals', _totals,
    'top_items', _top_items,
    'top_fans', _top_fans,
    'recent', _recent,
    'series', _series
  );
END;
$$;
