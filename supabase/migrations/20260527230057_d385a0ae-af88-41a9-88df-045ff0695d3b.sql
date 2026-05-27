
-- 1) Lock down: revoke EXECUTE on every public schema function from PUBLIC and anon.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- 2) Re-grant only the user-facing RPCs to authenticated users.
DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'get_dashboard_data()',
    'get_oracle_dashboard()',
    'get_public_profile(text)',
    'get_artist_dashboard()',
    'get_badges_catalog()',
    'get_daily_status()',
    'get_active_boosts()',
    'get_crate_history(integer)',
    'get_crate_global_feed(integer)',
    'get_explorer_stats()',
    'get_explorer_feed(integer,text)',
    'get_live_drops()',
    'get_my_email()',
    'compute_engagement_metrics(uuid)',
    'compute_level(integer)',
    'create_or_sync_profile()',
    'claim_mission(text)',
    'claim_artist_item(uuid)',
    'claim_live_drop(uuid)',
    'claim_vip_perk(uuid)',
    'create_artist_item(artist_item_kind,text,text,text,integer,integer)',
    'create_live_drop(artist_item_kind,text,text,text,integer,integer,timestamptz,timestamptz)',
    'create_post(text)',
    'create_comment(uuid,text)',
    'toggle_like(uuid)',
    'toggle_follow(uuid)',
    'open_crate(text)',
    'burn_for_badge(uuid)',
    'become_artist()',
    'mark_all_notifications_read()'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    BEGIN
      EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated', fn);
    EXCEPTION WHEN undefined_function THEN
      RAISE NOTICE 'Skipping missing function: %', fn;
    END;
  END LOOP;
END$$;

-- 3) Ensure service_role keeps full access (edge functions / admin code).
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
