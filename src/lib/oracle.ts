// Shared Oracle helpers — ranks, colors, smart-action mapping (frontend mirror of edge function).

export type OracleRank =
  | "Rookie"
  | "Supporter"
  | "Insider"
  | "Groove Hunter"
  | "Viral Supporter"
  | "Legendary"
  | "Genesis Icon";

export const RANK_TIERS: { min: number; rank: OracleRank }[] = [
  { min: 951, rank: "Genesis Icon" },
  { min: 801, rank: "Legendary" },
  { min: 601, rank: "Viral Supporter" },
  { min: 401, rank: "Groove Hunter" },
  { min: 251, rank: "Insider" },
  { min: 101, rank: "Supporter" },
  { min: 0, rank: "Rookie" },
];

export function rankForScore(score: number): OracleRank {
  for (const t of RANK_TIERS) if (score >= t.min) return t.rank;
  return "Rookie";
}

// Tailwind class triplet per rank — used in pills and progress accents.
export const RANK_STYLES: Record<OracleRank, string> = {
  "Rookie": "border-muted-foreground/40 text-muted-foreground bg-muted/10",
  "Supporter": "border-accent/40 text-accent bg-accent/10",
  "Insider": "border-accent/60 text-accent bg-accent/15",
  "Groove Hunter": "border-primary/50 text-primary bg-primary/10",
  "Viral Supporter": "border-primary/70 text-primary bg-primary/15",
  "Legendary": "border-secondary/60 text-secondary bg-secondary/15",
  "Genesis Icon": "border-secondary/80 text-secondary bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/30",
};

// Compat: accept legacy ranks coming from older oracle_activity rows.
const LEGACY: Record<string, OracleRank> = {
  Rookie: "Rookie",
  Rising: "Supporter",
  Viral: "Viral Supporter",
  Legendary: "Legendary",
};
export function normalizeRank(raw: string | null | undefined, score: number): OracleRank {
  if (!raw) return rankForScore(score);
  if ((Object.values(RANK_TIERS).map((t) => t.rank) as string[]).includes(raw)) return raw as OracleRank;
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
  category: "engagement" | "social" | "support" | "collector" | "creator";
};
