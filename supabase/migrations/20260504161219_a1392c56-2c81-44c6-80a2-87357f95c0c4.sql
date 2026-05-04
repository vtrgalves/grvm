
CREATE OR REPLACE FUNCTION public.get_explorer_feed(_limit integer DEFAULT 50, _filter text DEFAULT NULL)
RETURNS TABLE (
  id uuid, user_id uuid, user_name text, user_level text,
  action text, points integer, description text,
  created_at timestamptz, tx_hash text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT t.id, t.user_id,
    COALESCE(p.name, 'Anônimo'), COALESCE(p.level, 'Listener'),
    t.action, t.points, t.description, t.created_at,
    '0x' || md5(t.id::text || t.created_at::text)
  FROM public.point_transactions t
  LEFT JOIN public.profiles p ON p.user_id = t.user_id
  WHERE (_filter IS NULL OR t.action = _filter)
  ORDER BY t.created_at DESC
  LIMIT LEAST(COALESCE(_limit, 50), 200);
$$;

CREATE OR REPLACE FUNCTION public.get_explorer_stats()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'total_tx', (SELECT count(*) FROM public.point_transactions),
    'total_grv_minted', (SELECT COALESCE(SUM(points), 0) FROM public.point_transactions WHERE points > 0),
    'total_grv_burned', (SELECT COALESCE(ABS(SUM(points)), 0) FROM public.point_transactions WHERE points < 0),
    'total_wallets', (SELECT count(*) FROM public.profiles),
    'tx_24h', (SELECT count(*) FROM public.point_transactions WHERE created_at > now() - interval '24 hours')
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_explorer_feed(integer, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_explorer_stats() TO authenticated, anon;
