-- 1) Remove email column read access from authenticated/anon to prevent enumeration
REVOKE SELECT (email) ON public.profiles FROM authenticated, anon;

-- 2) Remove tables from supabase_realtime publication that are not actively used via realtime
ALTER PUBLICATION supabase_realtime DROP TABLE public.artist_items;
ALTER PUBLICATION supabase_realtime DROP TABLE public.follows;
ALTER PUBLICATION supabase_realtime DROP TABLE public.post_comments;
ALTER PUBLICATION supabase_realtime DROP TABLE public.post_likes;
ALTER PUBLICATION supabase_realtime DROP TABLE public.user_missions;