export type BoostRarity = "common" | "rare" | "epic" | "legendary";

export interface BoostDef {
  slug: string;
  name: string;
  icon: string;
  effect: string;
  description: string;
  cost: number;
  durationMin: number;
  rarity: BoostRarity;
  requiredPoints: number;
  color: string; // tailwind gradient color
  glow: string;
  limited?: { until: string; tag: string };
}

export const BOOSTS: BoostDef[] = [
  {
    slug: "xp_booster",
    name: "XP Booster",
    icon: "⚡",
    effect: "+2x XP por 1 hora",
    description: "Dobre sua evolução por tempo limitado.",
    cost: 300,
    durationMin: 60,
    rarity: "common",
    requiredPoints: 0,
    color: "from-primary/30 to-primary/10",
    glow: "shadow-[0_0_40px_hsl(var(--primary)/0.4)]",
  },
  {
    slug: "grv_multiplier",
    name: "GRV Multiplier",
    icon: "🔥",
    effect: "+50% GRV em missões por 2h",
    description: "Aumente seus ganhos temporariamente.",
    cost: 500,
    durationMin: 120,
    rarity: "rare",
    requiredPoints: 0,
    color: "from-purple-500/30 to-fuchsia-500/10",
    glow: "shadow-[0_0_40px_rgba(168,85,247,0.45)]",
  },
  {
    slug: "spotlight_boost",
    name: "Spotlight Boost",
    icon: "🚀",
    effect: "Perfil em destaque no feed por 24h",
    description: "Ganhe visibilidade dentro do ecossistema.",
    cost: 1200,
    durationMin: 60 * 24,
    rarity: "epic",
    requiredPoints: 500,
    color: "from-accent/30 to-pink-500/10",
    glow: "shadow-[0_0_45px_hsl(var(--accent)/0.5)]",
  },
  {
    slug: "nft_hunter",
    name: "NFT Hunter",
    icon: "💎",
    effect: "+20% chance de NFT raro em drops",
    description: "Aumente suas chances em caixas e drops.",
    cost: 800,
    durationMin: 60 * 6,
    rarity: "rare",
    requiredPoints: 1500,
    color: "from-cyan-400/30 to-blue-500/10",
    glow: "shadow-[0_0_40px_rgba(34,211,238,0.45)]",
  },
  {
    slug: "backstage_pass",
    name: "Backstage Pass",
    icon: "🎧",
    effect: "Acesso prioritário a experiências",
    description: "Entre antes de todos nos eventos limitados.",
    cost: 2000,
    durationMin: 60 * 24 * 3,
    rarity: "epic",
    requiredPoints: 4000,
    color: "from-amber-400/30 to-orange-500/10",
    glow: "shadow-[0_0_45px_rgba(251,191,36,0.45)]",
  },
  {
    slug: "genesis_aura",
    name: "Genesis Aura",
    icon: "🌌",
    effect: "Moldura holográfica + badge lendário",
    description: "Mostre ao ecossistema seu status lendário.",
    cost: 5000,
    durationMin: 60 * 24 * 7,
    rarity: "legendary",
    requiredPoints: 10000,
    color: "from-fuchsia-500/30 via-primary/20 to-accent/30",
    glow: "shadow-[0_0_60px_hsl(var(--accent)/0.6)]",
  },
  {
    slug: "weekend_boost",
    name: "Weekend Boost",
    icon: "🔥",
    effect: "+100% GRV em eventos",
    description: "Oferta relâmpago de fim de semana.",
    cost: 700,
    durationMin: 60 * 12,
    rarity: "rare",
    requiredPoints: 0,
    color: "from-rose-500/30 to-orange-500/10",
    glow: "shadow-[0_0_45px_rgba(244,63,94,0.5)]",
    limited: { until: "12h", tag: "Oferta Limitada" },
  },
];

export const RARITY_LABEL: Record<BoostRarity, string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
};

export const RARITY_COLOR: Record<BoostRarity, string> = {
  common: "border-primary/40 text-primary",
  rare: "border-purple-400/50 text-purple-300",
  epic: "border-accent/50 text-accent",
  legendary: "border-fuchsia-400/60 text-fuchsia-300",
};

export function formatRemaining(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}
