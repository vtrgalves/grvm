export interface MissionDef {
  key: string;
  label: string;
  points: number;
}

export const FAN_MISSIONS: MissionDef[] = [
  { key: "follow_3_artists", label: "Seguir 3 artistas", points: 30 },
  { key: "like_5_songs", label: "Curtir 5 músicas", points: 25 },
  { key: "share_1_story", label: "Compartilhar 1 música no Stories", points: 50 },
  { key: "comment_1_song", label: "Comentar em uma música", points: 15 },
  { key: "create_playlist", label: "Criar playlist com 5 músicas", points: 40 },
  { key: "invite_1_friend", label: "Convidar 1 amigo", points: 150 },
];

export const MUSICIAN_MISSIONS: MissionDef[] = [
  { key: "publish_first_song", label: "Publicar primeira música", points: 50 },
  { key: "add_cover_photo", label: "Adicionar foto de capa", points: 30 },
  { key: "reply_3_comments", label: "Responder 3 comentários", points: 30 },
  { key: "connect_social", label: "Conectar Instagram/Spotify", points: 40 },
  { key: "schedule_show", label: "Agendar 1 show", points: 50 },
  { key: "invite_2_musicians", label: "Convidar 2 músicos amigos", points: 300 },
];

export const FAN_BONUS = 200;
export const MUSICIAN_BONUS = 400;
