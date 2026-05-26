
-- 1) Restrict badges catalog to authenticated users (consistency with rest of schema)
DROP POLICY IF EXISTS "Badges são públicas" ON public.badges;
CREATE POLICY "Badges viewable by authenticated"
ON public.badges
FOR SELECT
TO authenticated
USING (true);

REVOKE SELECT ON public.badges FROM anon;
GRANT SELECT ON public.badges TO authenticated;

-- 2) Realtime: explicitly allow subscriptions to public-feed topics (posts, live_drops, vip_perks)
DROP POLICY IF EXISTS "Users subscribe own topics" ON realtime.messages;
CREATE POLICY "Users subscribe own topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (realtime.topic() LIKE 'profile-%')
  OR (realtime.topic() LIKE 'notifications-%')
  OR (realtime.topic() LIKE 'user-%:%')
  OR (realtime.topic() = 'posts')
  OR (realtime.topic() LIKE 'posts:%')
  OR (realtime.topic() = 'live_drops')
  OR (realtime.topic() LIKE 'live_drops:%')
  OR (realtime.topic() = 'vip_perks')
  OR (realtime.topic() LIKE 'vip_perks:%')
);
