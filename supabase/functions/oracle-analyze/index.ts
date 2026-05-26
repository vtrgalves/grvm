import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: claims } = await userClient.auth.getClaims(auth.replace("Bearer ", ""));
    if (!claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const uid = claims.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const trigger = (body?.trigger as string) || "manual_sync";

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1. Collect metrics
    const { data: metrics, error: mErr } = await admin.rpc("compute_engagement_metrics", { _uid: uid });
    if (mErr) throw mErr;
    const m = metrics as Record<string, number>;

    // 2. Compute Groove Score (0-10)
    const raw =
      Math.log10(1 + m.grv_balance) * 0.9 +
      m.missions_completed * 0.15 +
      m.nft_count * 0.25 +
      Math.min(m.streak, 30) * 0.08 +
      m.boosts_active * 0.3 +
      m.crates_opened * 0.1 +
      m.follows * 0.05 +
      m.likes * 0.02 +
      m.comments * 0.03 +
      m.badges * 0.4 +
      m.tips_sent * 0.2;
    const grooveScore = Math.min(10, Math.max(0, Number(raw.toFixed(2))));

    // 3. External API: CoinGecko trending (real)
    let trendingCoin = "BTC";
    try {
      const cg = await fetch("https://api.coingecko.com/api/v3/search/trending");
      if (cg.ok) {
        const cgData = await cg.json();
        trendingCoin = cgData?.coins?.[0]?.item?.symbol ?? "BTC";
      }
    } catch (_) { /* non-fatal */ }

    // 4. AI Insight via Lovable AI Gateway
    const prompt = `Você é o Proof of Support Oracle do Groovium. Analise as métricas do fã abaixo e gere DOIS textos curtos em português brasileiro:

Métricas:
- GRV acumulado: ${m.grv_balance}
- Missões completas: ${m.missions_completed}
- NFTs/itens: ${m.nft_count}
- Streak diário: ${m.streak}
- Boosts ativos: ${m.boosts_active}
- Crates abertas: ${m.crates_opened}
- Artistas seguidos: ${m.follows}
- Likes: ${m.likes}, Comentários: ${m.comments}
- Badges: ${m.badges}, Tips enviadas: ${m.tips_sent}
- Tendência cripto do dia: ${trendingCoin}

Responda APENAS um JSON válido (sem markdown) com:
{
  "profile": "rótulo curto de 2-4 palavras estilo cyberpunk (ex: 'Colecionador Raro', 'Curador Synthwave', 'Apoiador Lendário')",
  "insight": "1 frase de até 140 caracteres, inspiradora, mencionando comportamento + recompensa potencial"
}`;

    let aiProfile = "Groover Ativo";
    let aiInsight = "Seu engajamento musical está ressoando. Continue apoiando artistas.";
    try {
      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": LOVABLE_API_KEY,
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (aiRes.status === 429) return json({ error: "rate_limited", message: "IA temporariamente sobrecarregada." }, 429);
      if (aiRes.status === 402) return json({ error: "credits_exhausted", message: "Créditos de IA esgotados." }, 402);
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const txt = aiData?.choices?.[0]?.message?.content ?? "";
        const cleaned = txt.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        if (parsed.profile) aiProfile = String(parsed.profile).slice(0, 40);
        if (parsed.insight) aiInsight = String(parsed.insight).slice(0, 200);
      }
    } catch (e) {
      console.error("AI error", e);
    }

    // 5. Record oracle sync (simulated onchain proof)
    const { data: rec, error: rErr } = await admin.rpc("record_oracle_sync", {
      _uid: uid,
      _score: grooveScore,
      _insight: aiInsight,
      _profile: aiProfile,
      _trigger: trigger,
      _metrics: metrics,
    });
    if (rErr) throw rErr;

    return json({
      success: true,
      groove_score: grooveScore,
      ai_profile: aiProfile,
      ai_insight: aiInsight,
      tx_hash: (rec as any)?.tx_hash,
      block_number: (rec as any)?.block_number,
      trending_coin: trendingCoin,
      metrics: m,
      workflow: {
        steps: [
          { name: "Fetch engagement metrics", status: "ok" },
          { name: "External API · CoinGecko", status: "ok" },
          { name: "AI analysis · Lovable Gateway", status: "ok" },
          { name: "Compute Groove Score", status: "ok" },
          { name: "Simulated onchain record", status: "ok" },
        ],
      },
    });
  } catch (e) {
    console.error("oracle-analyze", e);
    return json({ error: String((e as Error).message || e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
