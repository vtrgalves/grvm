REVOKE EXECUTE ON FUNCTION public.create_post(text) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.toggle_like(uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.create_comment(uuid, text) FROM anon, authenticated, public;

GRANT EXECUTE ON FUNCTION public.create_post(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_like(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_comment(uuid, text) TO authenticated;