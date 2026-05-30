// Shared Oracle helpers — 8 ranks oficiais com aliases para compat histórica.

export type OracleRank =
  | "Rookie"
  | "Listener"
  | "Supporter"
  | "Insider"
  | "Groove Hunter"
  | "Backstage"
  | "Legend"
  | "Genesis Icon";

export const RANK_TIERS: { min: number; rank: OracleRank }[] = [
  { min: 900, rank: "Genesis Icon" },
  { min: 800, rank: "Legend" },
  { min: 650, rank: "Backstage" },
  { min: 500, rank: "Groove Hunter" },
  { min: 350, rank: "Insider" },
  { min: 200, rank: "Supporter" },
  { min: 100, rank: "Listener" },
  { min: 0,   rank: "Rookie" },
];

export function rankForScore(score: number): OracleRank {
  for (const t of RANK_TIERS) if (score >= t.min) return t.rank;
  return "Rookie";
}

export const RANK_STYLES: Record<OracleRank, string> = {
  "Rookie":       "border-muted-foreground/40 text-muted-foreground bg-muted/10",
  "Listener":     "border-accent/40 text-accent bg-accent/10",
  "Supporter":    "border-accent/60 text-accent bg-accent/15",
  "Insider":      "border-accent/70 text-accent bg-accent/15",
  "Groove Hunter":"border-primary/50 text-primary bg-primary/10",
  "Backstage":    "border-primary/70 text-primary bg-primary/15",
  "Legend":       "border-secondary/60 text-secondary bg-secondary/15",
  "Genesis Icon": "border-secondary/80 text-secondary bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/30",
};

// Compatibilidade: registros antigos mapeados para os 8 ranks oficiais.
const LEGACY: Record<string, OracleRank> = {
  Rookie: "Rookie",
  Rising: "Listener",
  Viral: "Backstage",
  "Viral Supporter": "Backstage",
  Legendary: "Legend",
};

export function normalizeRank(raw: string | null | undefined, score: number): OracleRank {
  if (!raw) return rankForScore(score);
  const known = RANK_TIERS.find((t) => t.rank === raw);
  if (known) return known.rank;
  return LEGACY[raw] ?? rankForScore(score);
}

export type SmartAction = {
  id: string;
  action: string;
  description?: string | null;
  points: number;
  created_at: string;
  label: string;
  icon: string;
  reputation_delta: number;
  category: "engagement" | "social" | "support" | "collector" | "creator" | "meta";
  premium?: boolean;
};
