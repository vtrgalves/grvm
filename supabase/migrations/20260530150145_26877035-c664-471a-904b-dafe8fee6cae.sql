-- Phase 2: Oracle bonus distribution

-- 1) Add oracle_bonus mapping to smart action derivation
CREATE OR REPLACE FUNCTION public._derive_smart_action(_action text, _points integer, _desc text)
RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE _action
    WHEN 'mission_complete'    THEN jsonb_build_object('label','Missão concluída','icon','⚡','category','engagement','reputation_delta',15,'premium',false)
    WHEN 'daily_checkin'       THEN jsonb_build_object('label','Check-in diário','icon','🔥','category','engagement','reputation_delta',8,'premium',false)
    WHEN 'post_create'         THEN jsonb_build_object('label','Publicação no feed','icon','📡','category','social','reputation_delta',6,'premium',false)
    WHEN 'post_like'           THEN jsonb_build_object('label','Curtida','icon','❤️','category','social','reputation_delta',2,'premium',false)
    WHEN 'post_comment'        THEN jsonb_build_object('label','Comentário','icon','💬','category','social','reputation_delta',5,'premium',false)
    WHEN 'follow_artist'       THEN jsonb_build_object('label','Seguiu artista','icon','🎧','category','social','reputation_delta',10,'premium',false)
    WHEN 'crate_open'          THEN jsonb_build_object('label','Abriu Crate','icon','🎁','category','collector','reputation_delta',8,'premium',false)
    WHEN 'crate_prize'         THEN jsonb_build_object('label','Prêmio de Crate','icon','💎','category','collector','reputation_delta',12,'premium',false)
    WHEN 'item_purchase'       THEN jsonb_build_object('label','NFT adquirido','icon','🪩','category','support','reputation_delta',32,'premium',true)
    WHEN 'item_sale'           THEN jsonb_build_object('label','Venda de item','icon','💸','category','creator','reputation_delta',25,'premium',true)
    WHEN 'vip_claim'           THEN jsonb_build_object('label','Resgate VIP','icon','👑','category','support','reputation_delta',40,'premium',true)
    WHEN 'badge_burn'          THEN jsonb_build_object('label','Burn de Badge','icon','🔥','category','collector','reputation_delta',45,'premium',true)
    WHEN 'signup_bonus'        THEN jsonb_build_object('label','Boas-vindas Groovium','icon','🌟','category','engagement','reputation_delta',5,'premium',false)
    WHEN 'tip_sent'            THEN jsonb_build_object('label','Tip enviado','icon','💸','category','support','reputation_delta',20,'premium',true)
    WHEN 'oracle_sync'         THEN jsonb_build_object('label','Oracle Sync','icon','🔗','category','meta','reputation_delta',5,'premium',false)
    WHEN 'oracle_bonus'        THEN jsonb_build_object('label','Bônus Oracle','icon','🎁','category','meta','reputation_delta',3,'premium',false)
    WHEN 'boost_activate'      THEN jsonb_build_object('label','Boost ativado','icon','⚡','category','engagement','reputation_delta',12,'premium',false)
    WHEN 'nft_mint'            THEN jsonb_build_object('label','NFT cunhado','icon','🪩','category','collector','reputation_delta',50,'premium',true)
    WHEN 'legendary_crate'     THEN jsonb_build_object('label','Crate Lendária','icon','🏆','category','collector','reputation_delta',60,'premium',true)
    WHEN 'genesis_crate'       THEN jsonb_build_object('label','Crate Genesis','icon','🌌','category','collector','reputation_delta',90,'premium',true)
    WHEN 'badge_unlock'        THEN jsonb_build_object('label','Badge desbloqueada','icon','🏅','category','collector','reputation_delta',35,'premium',true)
    WHEN 'rank_unlock'         THEN jsonb_build_object('label','Novo Rank conquistado','icon','🚀','category','meta','reputation_delta',50,'premium',true)
    WHEN 'genesis_achievement' THEN jsonb_build_object('label','Genesis Icon','icon','👁️','category','meta','reputation_delta',120,'premium',true)
    WHEN 'experience_redeem'   THEN jsonb_build_object('label','Experiência Premium resgatada','icon','🎟️','category','support','reputation_delta',70,'premium',true)
    ELSE                         jsonb_build_object(
      'label', upper(replace(_action,'_',' ')),
      'icon','🔹','category','engagement',
      'reputation_delta', GREATEST(0, LEAST(20, abs(COALESCE(_points,0))/20))::int,
      'premium', false
    )
  END;
$$;

-- 2) Award oracle bonus: insert point_tx (trigger creates smart_action), update profile balance
CREATE OR REPLACE FUNCTION public.award_oracle_bonus(
  _uid uuid, _bonus integer, _sync_id uuid DEFAULT NULL, _reason text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _tx uuid; _bal integer;
BEGIN
  IF _uid IS NULL OR _bonus IS NULL OR _bonus <= 0 THEN
    RETURN jsonb_build_object('awarded', 0);
  END IF;
  _bonus := LEAST(_bonus, 200);

  INSERT INTO public.point_transactions (user_id, action, points, description)
  VALUES (_uid, 'oracle_bonus', _bonus,
          COALESCE(_reason, 'Bônus pós-sincronização do Proof of Support Oracle'))
  RETURNING id INTO _tx;

  UPDATE public.profiles
     SET grv_points = grv_points + _bonus
   WHERE user_id = _uid
  RETURNING grv_points INTO _bal;

  IF _sync_id IS NOT NULL THEN
    UPDATE public.smart_actions
       SET sync_id = _sync_id
     WHERE source_tx_id = _tx;
  END IF;

  RETURN jsonb_build_object('awarded', _bonus, 'tx_id', _tx, 'balance', COALESCE(_bal,0));
END $$;

REVOKE EXECUTE ON FUNCTION public.award_oracle_bonus(uuid, integer, uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.award_oracle_bonus(uuid, integer, uuid, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_oracle_bonus(uuid, integer, uuid, text) TO service_role;