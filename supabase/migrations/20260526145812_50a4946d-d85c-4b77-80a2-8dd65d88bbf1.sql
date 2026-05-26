REVOKE EXECUTE ON FUNCTION public.create_or_sync_profile() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_or_sync_profile() FROM anon;
GRANT EXECUTE ON FUNCTION public.create_or_sync_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_or_sync_profile() TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_dashboard_data() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_dashboard_data() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_data() TO service_role;