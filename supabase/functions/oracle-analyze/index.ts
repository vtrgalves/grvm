import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const log = (msg: string, extra?: unknown) =>
  console.log(`[Oracle CRE] ${msg}`, extra ? JSON.stringify(extra) : "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ success: false, error: "Method not allowed" }, 405);

  const startedAt = Date.now();
  try {
    // ── AUTH ────────────────────────────────────────────────
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return json({ success: false, error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: claims } = await userClient.auth.getClaims(auth.replace("Bearer ", ""));
    const uid = claims?.claims?.sub as string | undefined;
    if (!uid) return json({ success: false, error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const trigger = (body?.trigger as string) || "manual_sync";
    log("workflow.start", { uid, trigger });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // ── STEP 1 · ENGAGEMENT METRICS ─────────────────────────
    const { data: metrics, error: mErr } = await admin.rpc("compute_engagement_metrics", { _uid: uid });
    if (mErr) throw new Error(`metrics: ${mErr.message}`);
    const m = (metrics ?? {}) as Record<string, number>;
    log("step1.metrics", m);

    // ── STEP 2 · EXTERNAL APIS (parallel) ───────────────────
    const ext = await fetchExternalSignals();
    log("step2.external", ext);

    // ── STEP 3 · GROOVE SCORE (0–1000) ──────────────────────
    const grooveScore = computeGrooveScore(m, ext);
    log("step3.score", { grooveScore });

    // ── STEP 4 · AI ANALYSIS ────────────────────────────────
    const ai = await runAi(m, ext, grooveScore);
    log("step4.ai", ai);

    // ── STEP 5 · PERSIST + SIMULATED ONCHAIN PROOF ──────────
    const { data: rec, error: rErr } = await admin.rpc("record_oracle_sync", {
      _uid: uid,
      _score: grooveScore,
      _insight: ai.insight,
      _profile: ai.profile,
      _trigger: trigger,
      _metrics: metrics,
      _rank: ai.rank,
      _external: ext,
    });
    if (rErr) throw new Error(`persist: ${rErr.message}`);
    const proof = rec as { tx_hash: string; block_number: number; id: string };
    log("step5.persisted", proof);

    return json({
      success: true,
      grooveScore,
      insight: ai.insight,
      profile: ai.profile,
      rank: ai.rank,
      externalData: ext,
      txHash: proof.tx_hash,
      blockNumber: proof.block_number,
      syncedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      workflow: [
        { name: "Engagement metrics", status: "ok" },
        { name: "External APIs (CoinGecko · MusicBrainz)", status: "ok" },
        { name: "Groove Score (0-1000)", status: "ok" },
        { name: "AI · Lovable Gateway (Gemini)", status: "ok" },
        { name: "Simulated onchain proof", status: "ok" },
      ],
    });
  } catch (e) {
    console.error("[Oracle CRE] ERROR", e);
    return json({ success: false, error: (e as Error).message || String(e) }, 500);
  }
});

// ── HELPERS ───────────────────────────────────────────────
async function fetchExternalSignals() {
  const ethPromise = fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,chainlink&vs_currencies=usd&include_24hr_change=true",
  ).then((r) => (r.ok ? r.json() : null)).catch(() => null);

  const trendPromise = fetch("https://api.coingecko.com/api/v3/search/trending")
    .then((r) => (r.ok ? r.json() : null)).catch(() => null);

  const mbPromise = fetch(
    "https://musicbrainz.org/ws/2/artist/?query=tag:electronic&fmt=json&limit=1",
    { headers: { "User-Agent": "Groovium-Oracle/1.0 (https://grvm.lovable.app)" } },
  ).then((r) => (r.ok ? r.json() : null)).catch(() => null);

  const [eth, trend, mb] = await Promise.all([ethPromise, trendPromise, mbPromise]);

  return {
    eth_usd: eth?.ethereum?.usd ?? null,
    eth_change_24h: eth?.ethereum?.usd_24h_change ?? null,
    link_usd: eth?.chainlink?.usd ?? null,
    trending_coin: trend?.coins?.[0]?.item?.symbol ?? "BTC",
    trending_name: trend?.coins?.[0]?.item?.name ?? "Bitcoin",
    music_seed: mb?.artists?.[0]?.name ?? "Synthwave Pulse",
    music_score: mb?.artists?.[0]?.score ?? 90,
    fetched_at: new Date().toISOString(),
  };
}

function computeGrooveScore(m: Record<string, number>, ext: Record<string, unknown>) {
  // Engagement base (0-700)
  const engagement =
    Math.log10(1 + (m.grv_balance || 0)) * 60 +
    (m.missions_completed || 0) * 12 +
    (m.nft_count || 0) * 18 +
    Math.min(m.streak || 0, 30) * 6 +
    (m.boosts_active || 0) * 22 +
    (m.crates_opened || 0) * 8 +
    (m.follows || 0) * 4 +
    (m.likes || 0) * 1.5 +
    (m.comments || 0) * 2.5 +
    (m.badges || 0) * 30 +
    (m.tips_sent || 0) * 14;

  // Inactivity penalty
  const inactivity = (m.streak || 0) < 1 ? -25 : 0;

  // Market alignment bonus (0-50): trending market = momentum
  const change = Number((ext as any).eth_change_24h ?? 0);
  const marketBonus = Math.max(-15, Math.min(40, change * 4));

  // Music signal (0-30)
  const musicBonus = Math.min(30, Number((ext as any).music_score ?? 0) * 0.3);

  const raw = engagement + inactivity + marketBonus + musicBonus;
  return Math.max(0, Math.min(1000, Math.round(raw)));
}

async function runAi(
  m: Record<string, number>,
  ext: Record<string, unknown>,
  score: number,
): Promise<{ profile: string; insight: string; rank: string }> {
  const fallbackRank = score >= 800 ? "Legendary" : score >= 550 ? "Viral" : score >= 300 ? "Rising" : "Rookie";
  const fallback = {
    profile: "Groover Ativo",
    insight: "Seu engajamento musical está ressoando. Continue apoiando artistas.",
    rank: fallbackRank,
  };

  try {
    const prompt = `Analise o potencial musical e reputação digital deste fã do Groovium.

Métricas:
- GRV: ${m.grv_balance ?? 0}
- Missões: ${m.missions_completed ?? 0}
- NFTs: ${m.nft_count ?? 0}
- Streak: ${m.streak ?? 0}
- Boosts ativos: ${m.boosts_active ?? 0}
- Crates abertas: ${m.crates_opened ?? 0}
- Follows: ${m.follows ?? 0} · Likes: ${m.likes ?? 0} · Comentários: ${m.comments ?? 0}
- Badges: ${m.badges ?? 0} · Tips: ${m.tips_sent ?? 0}

Sinais externos:
- ETH USD: ${(ext as any).eth_usd} (24h ${(ext as any).eth_change_24h}%)
- LINK USD: ${(ext as any).link_usd}
- Trending: ${(ext as any).trending_name}
- Música seed: ${(ext as any).music_seed}

Groove Score já calculado: ${score}/1000.

Responda APENAS um JSON válido (sem markdown):
{
  "profile": "rótulo de 2-4 palavras cyberpunk",
  "insight": "1 frase de até 140 caracteres, inspiradora, mencionando comportamento e recompensa",
  "rank": "Rookie | Rising | Viral | Legendary"
}`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!r.ok) {
      console.warn("[Oracle CRE] AI status", r.status);
      return fallback;
    }
    const data = await r.json();
    const txt = data?.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(txt.replace(/```json|```/g, "").trim());
    return {
      profile: String(parsed.profile ?? fallback.profile).slice(0, 40),
      insight: String(parsed.insight ?? fallback.insight).slice(0, 200),
      rank: ["Rookie", "Rising", "Viral", "Legendary"].includes(parsed.rank) ? parsed.rank : fallbackRank,
    };
  } catch (e) {
    console.warn("[Oracle CRE] AI fallback", String((e as Error).message || e));
    return fallback;
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
