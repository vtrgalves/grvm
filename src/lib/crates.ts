export type CrateRarity = "common" | "rare" | "epic" | "legendary" | "genesis";

export interface CrateDef {
  slug: "neon" | "wave" | "cyber" | "genesis" | "event";
  name: string;
  tagline: string;
  cost: number;
  tier: CrateRarity;
  icon: string;
  gradient: string;
  glow: string;
  ring: string;
  odds: { common: number; rare: number; epic: number; legendary: number; genesis: number };
  limited?: { hours: number };
}

export const CRATES: CrateDef[] = [
  {
    slug: "neon",
    name: "Neon Crate",
    tagline: "O início da jornada. Glow azul.",
    cost: 250,
    tier: "common",
    icon: "📦",
    gradient: "from-primary/30 via-primary/10 to-transparent",
    glow: "shadow-[0_0_60px_hsl(var(--primary)/0.45)]",
    ring: "border-primary/40",
    odds: { common: 70, rare: 25, epic: 4, legendary: 1, genesis: 0 },
  },
  {
    slug: "wave",
    name: "Wave Crate",
    tagline: "Glow roxo. Prêmios raros aparecem.",
    cost: 800,
    tier: "rare",
    icon: "🎁",
    gradient: "from-purple-500/30 via-fuchsia-500/10 to-transparent",
    glow: "shadow-[0_0_60px_rgba(168,85,247,0.5)]",
    ring: "border-purple-400/50",
    odds: { common: 45, rare: 40, epic: 12, legendary: 2.5, genesis: 0.5 },
  },
  {
    slug: "cyber",
    name: "Cyber Crate",
    tagline: "Glow magenta. NFTs épicos liberados.",
    cost: 1500,
    tier: "epic",
    icon: "💠",
    gradient: "from-accent/30 via-pink-500/10 to-transparent",
    glow: "shadow-[0_0_70px_hsl(var(--accent)/0.55)]",
    ring: "border-accent/50",
    odds: { common: 25, rare: 40, epic: 25, legendary: 9, genesis: 1 },
  },
  {
    slug: "genesis",
    name: "Genesis Crate",
    tagline: "Holográfica. A mais rara de todas.",
    cost: 5000,
    tier: "legendary",
    icon: "🌌",
    gradient: "from-fuchsia-500/30 via-primary/20 to-accent/30",
    glow: "shadow-[0_0_90px_rgba(217,70,239,0.6)]",
    ring: "border-fuchsia-400/60",
    odds: { common: 10, rare: 25, epic: 35, legendary: 25, genesis: 5 },
  },
  {
    slug: "event",
    name: "Event Crate",
    tagline: "Limitada. Temporada Cyberwave.",
    cost: 2000,
    tier: "epic",
    icon: "🔥",
    gradient: "from-rose-500/30 via-orange-500/10 to-transparent",
    glow: "shadow-[0_0_70px_rgba(244,63,94,0.55)]",
    ring: "border-orange-400/50",
    odds: { common: 30, rare: 40, epic: 20, legendary: 8, genesis: 2 },
    limited: { hours: 18 },
  },
];

export const RARITY_META: Record<CrateRarity, { label: string; icon: string; color: string; glow: string; border: string }> = {
  common: { label: "Comum", icon: "⚪", color: "text-foreground", glow: "shadow-[0_0_30px_rgba(255,255,255,0.3)]", border: "border-white/30" },
  rare: { label: "Raro", icon: "🔵", color: "text-primary", glow: "shadow-[0_0_50px_hsl(var(--primary)/0.6)]", border: "border-primary/60" },
  epic: { label: "Épico", icon: "🟣", color: "text-purple-300", glow: "shadow-[0_0_60px_rgba(168,85,247,0.7)]", border: "border-purple-400/70" },
  legendary: { label: "Lendário", icon: "🟠", color: "text-orange-300", glow: "shadow-[0_0_70px_rgba(251,146,60,0.8)]", border: "border-orange-400/80" },
  genesis: { label: "Genesis", icon: "🌌", color: "text-accent", glow: "shadow-[0_0_90px_hsl(var(--accent)/0.9)]", border: "border-accent" },
};

// Reels for spinning roulette animation (purely visual)
export const REEL_POOL = [
  { icon: "🪙", name: "50 GRVM" },
  { icon: "💠", name: "500 GRVM" },
  { icon: "⚡", name: "XP Booster" },
  { icon: "🌊", name: "CyberWave" },
  { icon: "💎", name: "Neon Pulse" },
  { icon: "🚀", name: "Spotlight" },
  { icon: "🟪", name: "Moldura" },
  { icon: "🎧", name: "Listener" },
  { icon: "🌙", name: "Luna Genesis" },
  { icon: "👑", name: "Legend" },
  { icon: "🎟️", name: "Backstage" },
  { icon: "🌌", name: "Genesis NFT" },
  { icon: "🔥", name: "Multiplier" },
  { icon: "🪩", name: "Holo Avatar" },
];
