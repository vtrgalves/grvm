
-- 0. Remover FK para permitir perfis seed (trigger handle_new_user continua povoando perfis reais)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- 1. Atualizar bônus de cadastro: fã = 500 GRV
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _is_musician boolean := COALESCE(NEW.raw_user_meta_data->>'profile_type', 'fan') = 'musician';
  _bonus integer := CASE WHEN _is_musician THEN 200 ELSE 500 END;
BEGIN
  INSERT INTO public.profiles (user_id, name, email, profile_type, grv_points)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    CASE WHEN _is_musician THEN 'musician'::profile_type ELSE 'fan'::profile_type END,
    _bonus
  );

  INSERT INTO public.point_transactions (user_id, action, points, description)
  VALUES (NEW.id, 'signup_bonus', _bonus, 'Bônus de boas-vindas Groovium');

  IF NOT _is_musician THEN
    INSERT INTO public.user_missions (user_id, mission_key) VALUES
      (NEW.id, 'follow_3_artists'),
      (NEW.id, 'like_5_songs'),
      (NEW.id, 'share_1_story'),
      (NEW.id, 'comment_1_song'),
      (NEW.id, 'create_playlist'),
      (NEW.id, 'invite_1_friend');
  ELSE
    INSERT INTO public.user_missions (user_id, mission_key) VALUES
      (NEW.id, 'publish_first_song'),
      (NEW.id, 'add_cover_photo'),
      (NEW.id, 'reply_3_comments'),
      (NEW.id, 'connect_social'),
      (NEW.id, 'schedule_show'),
      (NEW.id, 'invite_2_musicians');
  END IF;

  RETURN NEW;
END;
$function$;

-- 2. Daily check-in
CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  day date NOT NULL,
  streak integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, day)
);
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own checkins" ON public.daily_checkins;
CREATE POLICY "Users see own checkins" ON public.daily_checkins
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.daily_checkin()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _today date := (now() AT TIME ZONE 'UTC')::date;
  _last RECORD;
  _streak integer := 1;
  _reward integer := 20;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF EXISTS (SELECT 1 FROM public.daily_checkins WHERE user_id = _uid AND day = _today) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'already_today');
  END IF;

  SELECT * INTO _last FROM public.daily_checkins
   WHERE user_id = _uid ORDER BY day DESC LIMIT 1;

  IF _last IS NOT NULL AND _last.day = _today - 1 THEN
    _streak := _last.streak + 1;
  END IF;

  INSERT INTO public.daily_checkins (user_id, day, streak) VALUES (_uid, _today, _streak);

  INSERT INTO public.point_transactions (user_id, action, points, description)
  VALUES (_uid, 'daily_checkin', _reward, 'Check-in diário · streak ' || _streak);

  UPDATE public.profiles SET grv_points = grv_points + _reward WHERE user_id = _uid;

  RETURN jsonb_build_object('success', true, 'points', _reward, 'streak', _streak);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_daily_status()
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'checked_today', EXISTS (
      SELECT 1 FROM public.daily_checkins
       WHERE user_id = auth.uid()
         AND day = (now() AT TIME ZONE 'UTC')::date
    ),
    'streak', COALESCE((
      SELECT streak FROM public.daily_checkins
       WHERE user_id = auth.uid()
       ORDER BY day DESC LIMIT 1
    ), 0)
  );
$$;

-- 3. Seeds — artistas fictícios
INSERT INTO public.profiles (user_id, name, email, profile_type, handle, bio, photo_url, grv_points, level, selected_genres)
VALUES
  ('11111111-1111-1111-1111-111111111101', 'Neon Frequency', 'neon@groovium.beta', 'musician', 'neonfrequency',
   '[seed] Transformando frequências em experiências digitais.',
   'https://api.dicebear.com/7.x/shapes/svg?seed=neon&backgroundColor=00d4ff',
   8420, 'Backstage', ARRAY['Synthwave','EDM']),
  ('11111111-1111-1111-1111-111111111102', 'Luna Vox', 'luna@groovium.beta', 'musician', 'lunavox',
   '[seed] Vozes do futuro conectadas pela blockchain musical.',
   'https://api.dicebear.com/7.x/shapes/svg?seed=luna&backgroundColor=ff2d95',
   6210, 'Backstage', ARRAY['Pop Futurista']),
  ('11111111-1111-1111-1111-111111111103', 'CyberGroove', 'cyber@groovium.beta', 'musician', 'cybergroove',
   '[seed] Ritmos urbanos para a nova era digital.',
   'https://api.dicebear.com/7.x/shapes/svg?seed=cyber&backgroundColor=8b5cf6',
   4980, 'Backstage', ARRAY['Hip Hop','Trap']),
  ('22222222-2222-2222-2222-222222222201', 'Lucas Neon', 'lucas@groovium.beta', 'fan', 'lucasneon',
   '[seed] Fã de synthwave desde sempre.',
   'https://api.dicebear.com/7.x/avataaars/svg?seed=lucas', 3200, 'Insider', ARRAY['Synthwave']),
  ('22222222-2222-2222-2222-222222222202', 'Ana Wave', 'ana@groovium.beta', 'fan', 'anawave',
   '[seed] Coletando NFTs musicais raros.',
   'https://api.dicebear.com/7.x/avataaars/svg?seed=ana', 2850, 'Insider', ARRAY['Pop']),
  ('22222222-2222-2222-2222-222222222203', 'CyberMike', 'mike@groovium.beta', 'fan', 'cybermike',
   '[seed] Hip hop futurista é vida.',
   'https://api.dicebear.com/7.x/avataaars/svg?seed=mike', 2400, 'Insider', ARRAY['Hip Hop']),
  ('22222222-2222-2222-2222-222222222204', 'Sofia Pulse', 'sofia@groovium.beta', 'fan', 'sofiapulse',
   '[seed] Curadora de drops raros.',
   'https://api.dicebear.com/7.x/avataaars/svg?seed=sofia', 1980, 'Insider', ARRAY['EDM','Pop']),
  ('22222222-2222-2222-2222-222222222205', 'Rico Bass', 'rico@groovium.beta', 'fan', 'ricobass',
   '[seed] Bass mais grave que black hole.',
   'https://api.dicebear.com/7.x/avataaars/svg?seed=rico', 1650, 'Supporter', ARRAY['EDM'])
ON CONFLICT DO NOTHING;

-- 4. Itens (NFTs e experiências por artista)
INSERT INTO public.artist_items (id, artist_id, kind, title, description, image_url, price_grv, supply, claimed_count, active)
VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111101', 'nft', 'Neon Pulse #001',
   '[seed] NFT genesis colecionável da Neon Frequency.',
   'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&q=80', 250, 100, 37, true),
  ('aaaaaaaa-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111101', 'nft', 'Frequency Core',
   '[seed] Acesso ao core sonoro do projeto.',
   'https://images.unsplash.com/photo-1614624532983-4ce03382d63d?w=800&q=80', 400, 50, 22, true),
  ('aaaaaaaa-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111101', 'experience', 'VIP Wave Pass',
   '[seed] Passe VIP para todos os shows digitais.',
   'https://images.unsplash.com/photo-1571266028243-d220bc3b4f1c?w=800&q=80', 600, 30, 11, true),
  ('aaaaaaaa-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111102', 'nft', 'Luna Genesis',
   '[seed] Primeiro NFT da era Luna Vox.',
   'https://images.unsplash.com/photo-1518972559570-7cc1309f3229?w=800&q=80', 300, 100, 44, true),
  ('aaaaaaaa-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111102', 'nft', 'Vox Signature',
   '[seed] Assinatura sonora autografada.',
   'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80', 450, 50, 18, true),
  ('aaaaaaaa-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111102', 'experience', 'Aurora Sound Pass',
   '[seed] Passe aurora para experiências holográficas.',
   'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80', 550, 40, 9, true),
  ('aaaaaaaa-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111103', 'nft', 'CyberBeat Drop',
   '[seed] Drop urbano colecionável.',
   'https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=800&q=80', 200, 150, 51, true),
  ('aaaaaaaa-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111103', 'nft', 'Urban Hologram',
   '[seed] Hologram colecionável da CyberGroove.',
   'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80', 380, 80, 27, true),
  ('aaaaaaaa-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111103', 'experience', 'Street Wave Pass',
   '[seed] Passe para sessões street ao vivo.',
   'https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=800&q=80', 500, 60, 13, true)
ON CONFLICT (id) DO NOTHING;

-- 5. Experiências VIP (perks)
INSERT INTO public.vip_perks (id, title, description, icon, required_level, required_points, cost_grv, supply, claimed_count, active)
VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'VIP Listening Session', '[seed] Escute um drop antes de todo mundo.', '🎧', 'Supporter', 500, 150, 100, 12, true),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'Meet & Greet Digital', '[seed] Encontro virtual exclusivo com o artista.', '🤝', 'Insider', 1500, 300, 50, 7, true),
  ('bbbbbbbb-0000-0000-0000-000000000003', 'Backstage Live', '[seed] Acesso aos bastidores de uma live.', '🎬', 'Insider', 1500, 250, 40, 5, true),
  ('bbbbbbbb-0000-0000-0000-000000000004', 'Hologram Experience', '[seed] Show holográfico em realidade aumentada.', '🪩', 'Backstage', 4000, 500, 25, 3, true),
  ('bbbbbbbb-0000-0000-0000-000000000005', 'Studio Access', '[seed] Acompanhe uma sessão de gravação em tempo real.', '🎚️', 'Backstage', 4000, 600, 20, 2, true)
ON CONFLICT (id) DO NOTHING;

-- 6. Posts seed
INSERT INTO public.posts (id, user_id, content, likes_count, comments_count, created_at)
VALUES
  ('cccccccc-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111101',
   '[seed] Novo drop "Neon Pulse #001" disponível agora 🔊 garante o seu antes que acabe.', 124, 18, now() - interval '2 hours'),
  ('cccccccc-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111102',
   '[seed] Hologram Show confirmado para o próximo mês ✨ quem vem?', 89, 12, now() - interval '5 hours'),
  ('cccccccc-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111103',
   '[seed] Studio em chamas hoje 🔥 vem aí um drop urbano pesado.', 156, 24, now() - interval '8 hours'),
  ('cccccccc-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222201',
   '[seed] Acabei de garantir o Frequency Core 🎶 sensação Web3 musical é outra coisa.', 41, 6, now() - interval '12 hours'),
  ('cccccccc-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222202',
   '[seed] Ranking top 10 chegando 🚀 missões diárias fazem milagre.', 33, 4, now() - interval '1 day'),
  ('cccccccc-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111101',
   '[seed] Obrigado pelos 8K GRV em tips essa semana 💜 vocês são absurdos.', 201, 32, now() - interval '1 day 6 hours')
ON CONFLICT (id) DO NOTHING;
