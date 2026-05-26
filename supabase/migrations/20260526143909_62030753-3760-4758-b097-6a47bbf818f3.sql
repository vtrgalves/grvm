
-- 1. point_transactions: remove client INSERT
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.point_transactions;
REVOKE INSERT ON public.point_transactions FROM anon, authenticated, public;

-- 2. user_missions: remove client INSERT/UPDATE (only SECURITY DEFINER funcs write)
DROP POLICY IF EXISTS "Users can insert their own missions" ON public.user_missions;
DROP POLICY IF EXISTS "Users can update their own missions" ON public.user_missions;
REVOKE INSERT, UPDATE ON public.user_missions FROM anon, authenticated, public;

-- 3. profiles: restrict public reads, hide email from non-owners via view-level policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Authenticated can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Prevent email column exposure to other users: revoke column SELECT on email from authenticated,
-- then create a SECURITY DEFINER view/policy approach. Simpler: drop email column visibility via column grants.
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, user_id, name, handle, bio, level, photo_url, city, profile_type,
              grv_points, selected_genres, created_at, updated_at)
  ON public.profiles TO authenticated;
-- Owners can still see their own email via separate policy/function
CREATE OR REPLACE FUNCTION public.get_my_email()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT email FROM public.profiles WHERE user_id = auth.uid() $$;
REVOKE EXECUTE ON FUNCTION public.get_my_email() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_my_email() TO authenticated;

-- 4. crate_openings: restrict to own rows
DROP POLICY IF EXISTS "Crate openings public read" ON public.crate_openings;
CREATE POLICY "Users see own crate openings"
  ON public.crate_openings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. realtime.messages RLS - only allow users to subscribe to their own per-user topics
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users subscribe own topics" ON realtime.messages;
CREATE POLICY "Users subscribe own topics"
  ON realtime.messages FOR SELECT
  TO authenticated
  USING (
    topic LIKE 'profile-' || auth.uid()::text
    OR topic LIKE 'notifications-' || auth.uid()::text
    OR topic LIKE 'user-' || auth.uid()::text || ':%'
  );

-- 6. Restrict EXECUTE on SECURITY DEFINER functions to authenticated only (revoke from anon/public)
REVOKE EXECUTE ON FUNCTION public.get_public_profile(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_artist_dashboard() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_badges_catalog() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_feed(boolean, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_daily_status() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.burn_for_badge(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_active_boosts() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_crate_history(integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.open_crate(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.activate_boost(text, text, text, text, text, integer, integer, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_crate_global_feed(integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.toggle_like(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.create_comment(uuid, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.claim_mission(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.toggle_follow(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.become_artist() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_explorer_stats() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.send_tip(uuid, integer, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.daily_checkin() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.create_post(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_live_drops() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.claim_artist_item(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_explorer_feed(integer, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.claim_vip_perk(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.mark_all_notifications_read() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.create_artist_item(artist_item_kind, text, text, text, integer, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.create_live_drop(artist_item_kind, text, text, text, integer, integer, timestamptz, timestamptz) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.claim_live_drop(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_badges(uuid) FROM anon, public;
