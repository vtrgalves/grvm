
ALTER FUNCTION public.compute_level(integer) SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.claim_mission(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.claim_mission(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
