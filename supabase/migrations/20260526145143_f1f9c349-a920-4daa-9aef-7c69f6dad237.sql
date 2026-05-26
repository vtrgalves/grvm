
-- 1. Remove email column from authenticated SELECT grants on profiles
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (
  id, user_id, name, profile_type, city, photo_url, grv_points,
  selected_genres, created_at, updated_at, level, bio, handle
) ON public.profiles TO authenticated;

-- 2. user_badges: restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "User badges são públicas" ON public.user_badges;
REVOKE SELECT ON public.user_badges FROM anon;
GRANT SELECT ON public.user_badges TO authenticated;
CREATE POLICY "User badges viewable by authenticated"
  ON public.user_badges FOR SELECT
  TO authenticated
  USING (true);

-- 3. artist_items INSERT: require musician profile_type
DROP POLICY IF EXISTS "Artists can create own items" ON public.artist_items;
CREATE POLICY "Artists can create own items"
  ON public.artist_items FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = artist_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.profile_type = 'musician'
    )
  );

-- 4. live_drops INSERT: require musician profile_type
DROP POLICY IF EXISTS "Artists can create own drops" ON public.live_drops;
CREATE POLICY "Artists can create own drops"
  ON public.live_drops FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = artist_id
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.profile_type = 'musician'
    )
  );
