-- 1) Remove transactional claim tables from realtime publication to avoid leaking other users' rows via CDC
ALTER PUBLICATION supabase_realtime DROP TABLE public.item_claims;
ALTER PUBLICATION supabase_realtime DROP TABLE public.vip_claims;
ALTER PUBLICATION supabase_realtime DROP TABLE public.live_drop_claims;

-- 2) Lock down service_config with explicit deny-by-default policies for authenticated/anon.
-- The edge function uses service_role, which bypasses RLS, so backend access remains intact.
REVOKE ALL ON public.service_config FROM anon, authenticated;
GRANT ALL ON public.service_config TO service_role;

CREATE POLICY "Deny all select on service_config"
  ON public.service_config FOR SELECT
  TO anon, authenticated
  USING (false);

CREATE POLICY "Deny all insert on service_config"
  ON public.service_config FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "Deny all update on service_config"
  ON public.service_config FOR UPDATE
  TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE POLICY "Deny all delete on service_config"
  ON public.service_config FOR DELETE
  TO anon, authenticated
  USING (false);