export interface LevelDef {
  name: string;
  min: number;
  max: number;
  rewards: string[];
}

export const LEVELS: LevelDef[] = [
  { name: "Listener", min: 0, max: 499, rewards: ["Acesso ao feed", "Ganho de GRVM em interações", "Missões iniciais"] },
  { name: "Supporter", min: 500, max: 1499, rewards: ["Badge Supporter", "NFT de boas-vindas", "Drops semanais"] },
  { name: "Insider", min: 1500, max: 3999, rewards: ["Conteúdos exclusivos", "Sorteios mensais", "Descontos em experiências"] },
  { name: "Backstage", min: 4000, max: 9999, rewards: ["Meet & Greet virtuais", "NFTs raros", "Acesso antecipado"] },
  { name: "Legend", min: 10000, max: 24999, rewards: ["Clube VIP Groovium", "Experiências secretas", "Status de Lenda"] },
  { name: "Groove Master", min: 25000, max: 49999, rewards: ["Avatar holográfico", "Boost de GRVM permanente", "NFT épico"] },
  { name: "Genesis Holder", min: 50000, max: Infinity, rewards: ["Status Genesis", "Experiências lendárias", "NFT Genesis exclusivo"] },
];

export function getLevel(points: number): LevelDef {
  return LEVELS.find((l) => points >= l.min && points <= l.max) ?? LEVELS[0];
}

export function getNextLevel(points: number): LevelDef | null {
  const idx = LEVELS.findIndex((l) => points >= l.min && points <= l.max);
  if (idx < 0 || idx === LEVELS.length - 1) return null;
  return LEVELS[idx + 1];
}

export function getProgress(points: number): { pct: number; toNext: number; next: LevelDef | null } {
  const current = getLevel(points);
  const next = getNextLevel(points);
  if (!next) return { pct: 100, toNext: 0, next: null };
  const span = next.min - current.min;
  const done = points - current.min;
  return { pct: Math.min(100, (done / span) * 100), toNext: next.min - points, next };
}
