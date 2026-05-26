-- Hide email column from peers (column-level privilege). SECURITY DEFINER RPCs still read it.
REVOKE SELECT (email) ON public.profiles FROM anon, authenticated;

-- Hide burned_grv from peers; owner-only RPC (get_user_badges, SECURITY DEFINER) keeps working.
REVOKE SELECT (burned_grv) ON public.user_badges FROM anon, authenticated;