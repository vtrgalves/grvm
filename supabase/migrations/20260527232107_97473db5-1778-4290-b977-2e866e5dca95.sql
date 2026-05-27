
CREATE OR REPLACE FUNCTION public.get_smart_actions(_limit integer DEFAULT 12)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _rows jsonb;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', id,
    'action', action,
    'description', description,
    'points', points,
    'created_at', created_at,
    'label', CASE action
      WHEN 'mission_complete'    THEN 'Missão concluída'
      WHEN 'item_purchase'       THEN 'NFT/item coletado'
      WHEN 'item_sale'           THEN 'Venda de item'
      WHEN 'live_drop_purchase'  THEN 'Drop ao vivo coletado'
      WHEN 'live_drop_sale'      THEN 'Drop ao vivo vendido'
      WHEN 'crate_open'          THEN 'Caixa aberta'
      WHEN 'crate_prize'         THEN 'Prêmio de caixa'
      WHEN 'post_comment'        THEN 'Comentário relevante'
      WHEN 'post_like'           THEN 'Curtida no feed'
      WHEN 'follow_artist'       THEN 'Artista seguido'
      WHEN 'tip_sent'            THEN 'Tip enviado'
      WHEN 'tip_received'        THEN 'Tip recebido'
      WHEN 'vip_claim'           THEN 'Perk VIP resgatado'
      WHEN 'signup_bonus'        THEN 'Bônus de boas-vindas'
      WHEN 'daily_checkin'       THEN 'Check-in diário'
      WHEN 'boost_activated'     THEN 'Boost ativado'
      ELSE 'Atividade GRVM'
    END,
    'icon', CASE action
      WHEN 'mission_complete'    THEN '⚡'
      WHEN 'item_purchase'       THEN '🎵'
      WHEN 'item_sale'           THEN '💰'
      WHEN 'live_drop_purchase'  THEN '🎟️'
      WHEN 'live_drop_sale'      THEN '🚀'
      WHEN 'crate_open'          THEN '🔥'
      WHEN 'crate_prize'         THEN '💎'
      WHEN 'post_comment'        THEN '💬'
      WHEN 'post_like'           THEN '❤️'
      WHEN 'follow_artist'       THEN '🎧'
      WHEN 'tip_sent'            THEN '💸'
      WHEN 'tip_received'        THEN '🪙'
      WHEN 'vip_claim'           THEN '👑'
      WHEN 'signup_bonus'        THEN '🌌'
      WHEN 'daily_checkin'       THEN '📅'
      WHEN 'boost_activated'     THEN '⚡'
      ELSE '🟦'
    END,
    'reputation_delta', CASE action
      WHEN 'mission_complete'    THEN 15
      WHEN 'item_purchase'       THEN 32
      WHEN 'live_drop_purchase'  THEN 28
      WHEN 'item_sale'           THEN 22
      WHEN 'live_drop_sale'      THEN 26
      WHEN 'crate_open'          THEN 18
      WHEN 'crate_prize'         THEN 12
      WHEN 'post_comment'        THEN 8
      WHEN 'post_like'           THEN 3
      WHEN 'follow_artist'       THEN 10
      WHEN 'tip_sent'            THEN 25
      WHEN 'tip_received'        THEN 14
      WHEN 'vip_claim'           THEN 30
      WHEN 'signup_bonus'        THEN 5
      WHEN 'daily_checkin'       THEN 6
      WHEN 'boost_activated'     THEN 18
      ELSE 4
    END,
    'category', CASE action
      WHEN 'mission_complete'    THEN 'engagement'
      WHEN 'item_purchase'       THEN 'collector'
      WHEN 'live_drop_purchase'  THEN 'collector'
      WHEN 'item_sale'           THEN 'creator'
      WHEN 'live_drop_sale'      THEN 'creator'
      WHEN 'crate_open'          THEN 'engagement'
      WHEN 'crate_prize'         THEN 'engagement'
      WHEN 'post_comment'        THEN 'social'
      WHEN 'post_like'           THEN 'social'
      WHEN 'follow_artist'       THEN 'support'
      WHEN 'tip_sent'            THEN 'support'
      WHEN 'tip_received'        THEN 'creator'
      WHEN 'vip_claim'           THEN 'collector'
      WHEN 'signup_bonus'        THEN 'engagement'
      WHEN 'daily_checkin'       THEN 'engagement'
      WHEN 'boost_activated'     THEN 'engagement'
      ELSE 'engagement'
    END
  ) ORDER BY created_at DESC), '[]'::jsonb)
  INTO _rows
  FROM (
    SELECT id, action, description, points, created_at
    FROM public.point_transactions
    WHERE user_id = _uid
      AND action IN (
        'mission_complete','item_purchase','item_sale','live_drop_purchase',
        'live_drop_sale','crate_open','crate_prize','post_comment','post_like',
        'follow_artist','tip_sent','tip_received','vip_claim','signup_bonus',
        'daily_checkin','boost_activated'
      )
    ORDER BY created_at DESC
    LIMIT LEAST(COALESCE(_limit, 12), 50)
  ) t;

  RETURN _rows;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_smart_actions(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_smart_actions(integer) TO authenticated, service_role;
