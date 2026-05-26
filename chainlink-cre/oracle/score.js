// Deterministic Groove Score (0–10) used by the CRE workflow.
// Mirrors the formula in supabase/functions/oracle-analyze/index.ts
// so CRE runs and edge-function runs always agree.

export default function compute(metrics) {
  const m = metrics || {};
  const raw =
    Math.log10(1 + (m.grv_balance || 0)) * 0.9 +
    (m.missions_completed || 0) * 0.15 +
    (m.nft_count || 0) * 0.25 +
    Math.min(m.streak || 0, 30) * 0.08 +
    (m.boosts_active || 0) * 0.3 +
    (m.crates_opened || 0) * 0.1 +
    (m.follows || 0) * 0.05 +
    (m.likes || 0) * 0.02 +
    (m.comments || 0) * 0.03 +
    (m.badges || 0) * 0.4 +
    (m.tips_sent || 0) * 0.2;

  const score = Math.min(10, Math.max(0, Number(raw.toFixed(2))));
  return { score };
}
