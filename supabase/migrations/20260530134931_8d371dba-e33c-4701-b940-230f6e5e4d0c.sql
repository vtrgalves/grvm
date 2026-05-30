-- Restrict profiles.email exposure via column-level grants
REVOKE SELECT ON public.profiles FROM authenticated;
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, user_id, name, profile_type, city, photo_url, grv_points, selected_genres, created_at, updated_at, level, bio, handle)
  ON public.profiles TO authenticated;
GRANT SELECT (id, user_id, name, profile_type, city, photo_url, grv_points, selected_genres, created_at, updated_at, level, bio, handle)
  ON public.profiles TO anon;

-- Tighten realtime topic policy to prevent cross-user enumeration
DROP POLICY IF EXISTS "Users subscribe own topics" ON realtime.messages;
CREATE POLICY "Users subscribe own topics"
  ON realtime.messages FOR SELECT TO authenticated
  USING (
    realtime.topic() = ('profile-' || auth.uid()::text)
    OR realtime.topic() = ('notifications-' || auth.uid()::text)
    OR realtime.topic() LIKE ('user-' || auth.uid()::text || ':%')
    OR realtime.topic() = 'posts'
    OR realtime.topic() LIKE 'posts:%'
    OR realtime.topic() = 'live_drops'
    OR realtime.topic() LIKE 'live_drops:%'
    OR realtime.topic() = 'vip_perks'
    OR realtime.topic() LIKE 'vip_perks:%'
  );