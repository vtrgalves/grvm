import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type StepStatus = "ok" | "fallback" | "failed";

type WorkflowStep = {
  name: string;
  status: StepStatus;
  message?: string;
};

type ExternalSignals = {
  eth_usd: number;
  ethPrice: number;
  eth_change_24h: number;
  link_usd: number;
  trending_coin: string;
  trending_name: string;
  trending: string[];
  music_seed: string;
  artistSeed: string;
  music_score: number;
  fetched_at: string;
  api_offline: boolean;
  coingecko_ok: boolean;
  musicbrainz_ok: boolean;
  ai_ok?: boolean;
  warnings: string[];
};

type CoinGeckoPriceResponse = {
  ethereum?: { usd?: number; usd_24h_change?: number };
  chainlink?: { usd?: number };
};

type CoinGeckoTrendingResponse = {
  coins?: Array<{ item?: { symbol?: string; name?: string } }>;
};

type MusicBrainzResponse = {
  artists?: Array<{ name?: string; score?: number }>;
};

type AiResult = {
  profile: string;
  insight: string;
  rank: string;
  ai_ok: boolean;
  warning?: string;
};

const FALLBACK_INSIGHT = "Seu perfil ainda possui poucos dados para análise avançada.";
const FALLBACK_PROFILE = "Groover Rookie";
const FALLBACK_RANK = "Rookie";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startedAt = Date.now();
  const workflow: WorkflowStep[] = [];

  try {
    console.log("[1] Starting Oracle");

    if (req.method !== "POST") {
      return successResponse({
        grooveScore: 0,
        insight: FALLBACK_INSIGHT,
        profile: FALLBACK_PROFILE,
        rank: FALLBACK_RANK,
        externalData: fallbackExternalSignals(["Método HTTP inválido"]),
        txHash: fakeTxHash(),
        blockNumber: fakeBlockNumber(),
        syncedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        workflow: [{ name: "Request validation", status: "fallback", message: "Method not allowed" }],
      });
    }

    const env = readEnv();
    const auth = req.headers.get("Authorization");
    const body = await req.json().catch(() => ({}));
    const trigger = typeof body?.trigger === "string" ? body.trigger : "manual_sync";

    if (!env.SUPABASE_URL || !env.SERVICE_KEY) {
      console.error("STEP FAILED:", new Error("Missing Supabase Edge Function environment variables"));
      const ext = fallbackExternalSignals(["Configuração de backend indisponível"]);
      return successResponse({
        grooveScore: 0,
        insight: FALLBACK_INSIGHT,
        profile: FALLBACK_PROFILE,
        rank: FALLBACK_RANK,
        externalData: ext,
        txHash: fakeTxHash(),
        blockNumber: fakeBlockNumber(),
        syncedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        workflow: [{ name: "Environment validation", status: "fallback", message: "Backend env vars missing" }],
      });
    }

    if (!auth?.startsWith("Bearer ") || !env.ANON_KEY) {
      console.error("STEP FAILED:", new Error("Unauthorized request or missing anon key"));
      const ext = fallbackExternalSignals(["Sessão não autenticada"]);
      return successResponse({
        grooveScore: 0,
        insight: FALLBACK_INSIGHT,
        profile: FALLBACK_PROFILE,
        rank: FALLBACK_RANK,
        externalData: ext,
        txHash: fakeTxHash(),
        blockNumber: fakeBlockNumber(),
        syncedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        workflow: [{ name: "Auth validation", status: "fallback", message: "Usuário não autenticado" }],
      });
    }

    const userClient = createClient(env.SUPABASE_URL, env.ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: claims, error: claimsError } = await userClient.auth.getClaims(auth.replace("Bearer ", ""));
    if (claimsError) console.error("STEP FAILED:", claimsError);
    const uid = claims?.claims?.sub as string | undefined;

    if (!uid) {
      const ext = fallbackExternalSignals(["Token sem usuário válido"]);
      return successResponse({
        grooveScore: 0,
        insight: FALLBACK_INSIGHT,
        profile: FALLBACK_PROFILE,
        rank: FALLBACK_RANK,
        externalData: ext,
        txHash: fakeTxHash(),
        blockNumber: fakeBlockNumber(),
        syncedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        workflow: [{ name: "Auth validation", status: "fallback", message: "Token inválido" }],
      });
    }

    const admin = createClient(env.SUPABASE_URL, env.SERVICE_KEY);

    let metrics: Record<string, number> = fallbackMetrics();
    try {
      const { data, error } = await admin.rpc("compute_engagement_metrics", { _uid: uid });
      if (error) throw error;
      metrics = normalizeMetrics(data);
      workflow.push({ name: "Engagement metrics", status: "ok" });
    } catch (error) {
      console.error("STEP FAILED:", error);
      workflow.push({ name: "Engagement metrics", status: "fallback", message: stringifyError(error) });
    }

    const externalData = await fetchExternalSignals();
    workflow.push({
      name: "External APIs (CoinGecko · MusicBrainz)",
      status: externalData.api_offline ? "fallback" : "ok",
      message: externalData.warnings.join(" · ") || undefined,
    });

    console.log("[5] Calculating score");
    const grooveScore = computeGrooveScore(metrics, externalData);
    workflow.push({ name: "Groove Score (0-1000)", status: "ok" });

    console.log("[4] Calling Gemini");
    const ai = await runAi(metrics, externalData, grooveScore, env.LOVABLE_API_KEY || env.GEMINI_API_KEY);
    externalData.ai_ok = ai.ai_ok;
    if (ai.warning) externalData.warnings.push(ai.warning);
    workflow.push({
      name: "AI · Gemini",
      status: ai.ai_ok ? "ok" : "fallback",
      message: ai.warning,
    });

    console.log("[6] Saving database");
    let proof = { tx_hash: fakeTxHash(), block_number: fakeBlockNumber(), id: "fallback" };
    try {
      const { data, error } = await admin.rpc("record_oracle_sync", {
        _uid: uid,
        _score: grooveScore,
        _insight: ai.insight,
        _profile: ai.profile,
        _trigger: trigger,
        _metrics: metrics,
        _rank: ai.rank,
        _external: externalData,
      });
      if (error) throw error;
      proof = data as typeof proof;
      workflow.push({ name: "Simulated onchain proof", status: "ok" });
    } catch (error) {
      console.error("STEP FAILED:", error);
      workflow.push({ name: "Simulated onchain proof", status: "fallback", message: stringifyError(error) });
    }

    console.log("[7] Returning success");
    return successResponse({
      grooveScore,
      insight: ai.insight,
      profile: ai.profile,
      rank: ai.rank,
      externalData,
      txHash: proof.tx_hash,
      blockNumber: proof.block_number,
      syncedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      workflow,
    });
  } catch (error) {
    console.error("STEP FAILED:", error);
    const ext = fallbackExternalSignals([stringifyError(error)]);
    console.log("[7] Returning success");
    return successResponse({
      grooveScore: 0,
      insight: FALLBACK_INSIGHT,
      profile: FALLBACK_PROFILE,
      rank: FALLBACK_RANK,
      externalData: ext,
      txHash: fakeTxHash(),
      blockNumber: fakeBlockNumber(),
      syncedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      workflow: workflow.length ? workflow : [{ name: "Oracle fallback", status: "fallback", message: stringifyError(error) }],
    });
  }
});

function readEnv() {
  const env = {
    LOVABLE_API_KEY: Deno.env.get("LOVABLE_API_KEY") ?? "",
    GEMINI_API_KEY: Deno.env.get("GEMINI_API_KEY") ?? "",
    SUPABASE_URL: Deno.env.get("SUPABASE_URL") ?? "",
    ANON_KEY: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    SERVICE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  };
  console.log("[Oracle CRE] env", {
    SUPABASE_URL: Boolean(env.SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(env.SERVICE_KEY),
    GEMINI_API_KEY: Boolean(env.GEMINI_API_KEY),
    LOVABLE_API_KEY: Boolean(env.LOVABLE_API_KEY),
  });
  return env;
}

async function fetchExternalSignals(): Promise<ExternalSignals> {
  const warnings: string[] = [];
  let price: CoinGeckoPriceResponse | null = null;
  let trend: CoinGeckoTrendingResponse | null = null;
  let music: MusicBrainzResponse | null = null;

  console.log("[2] Fetching CoinGecko");
  try {
    const r = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,chainlink&vs_currencies=usd&include_24hr_change=true",
    );
    if (!r.ok) throw new Error(`CoinGecko price HTTP ${r.status}`);
    price = await r.json();
  } catch (error) {
    console.error("CoinGecko failed", error);
    console.error("STEP FAILED:", error);
    warnings.push("External API Offline");
  }

  try {
    const r = await fetch("https://api.coingecko.com/api/v3/search/trending");
    if (!r.ok) throw new Error(`CoinGecko trending HTTP ${r.status}`);
    trend = await r.json();
  } catch (error) {
    console.error("CoinGecko failed", error);
    console.error("STEP FAILED:", error);
    warnings.push("Trending fallback ativo");
  }

  console.log("[3] Fetching MusicBrainz");
  try {
    const r = await fetch("https://musicbrainz.org/ws/2/artist/?query=tag:electronic&fmt=json&limit=1", {
      headers: { "User-Agent": "Groovium-Oracle/1.0 (https://grvm.lovable.app)" },
    });
    if (!r.ok) throw new Error(`MusicBrainz HTTP ${r.status}`);
    music = await r.json();
  } catch (error) {
    console.error("MusicBrainz failed", error);
    console.error("STEP FAILED:", error);
    warnings.push("MusicBrainz fallback ativo");
  }

  const ethUsd = Number(price?.ethereum?.usd ?? 0);
  const change = Number(price?.ethereum?.usd_24h_change ?? 0);
  const linkUsd = Number(price?.chainlink?.usd ?? 0);
  const trending = Array.isArray(trend?.coins)
    ? trend.coins.slice(0, 3).map((c) => String(c?.item?.symbol ?? "")).filter(Boolean)
    : [];
  const artistSeed = String(music?.artists?.[0]?.name ?? "Unknown");
  const musicScore = Number(music?.artists?.[0]?.score ?? 0);
  const coingeckoOk = Boolean(price || trend);
  const musicbrainzOk = artistSeed !== "Unknown";

  return {
    eth_usd: ethUsd,
    ethPrice: ethUsd,
    eth_change_24h: change,
    link_usd: linkUsd,
    trending_coin: trending[0] ?? "—",
    trending_name: trend?.coins?.[0]?.item?.name ?? "Unknown",
    trending,
    music_seed: artistSeed,
    artistSeed,
    music_score: musicScore,
    fetched_at: new Date().toISOString(),
    api_offline: !coingeckoOk || !musicbrainzOk,
    coingecko_ok: coingeckoOk,
    musicbrainz_ok: musicbrainzOk,
    warnings: Array.from(new Set(warnings)),
  };
}

function computeGrooveScore(m: Record<string, number>, ext: ExternalSignals) {
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

  const inactivity = (m.streak || 0) < 1 ? -25 : 0;
  const marketBonus = Math.max(-15, Math.min(40, Number(ext.eth_change_24h ?? 0) * 4));
  const musicBonus = Math.min(30, Number(ext.music_score ?? 0) * 0.3);

  return Math.max(0, Math.min(1000, Math.round(engagement + inactivity + marketBonus + musicBonus)));
}

async function runAi(
  m: Record<string, number>,
  ext: ExternalSignals,
  score: number,
  apiKey: string,
): Promise<AiResult> {
  const fallbackRank = score >= 800 ? "Legendary" : score >= 550 ? "Viral" : score >= 300 ? "Rising" : FALLBACK_RANK;
  const fallback = {
    profile: FALLBACK_PROFILE,
    insight: FALLBACK_INSIGHT,
    rank: fallbackRank,
    ai_ok: false,
  };

  if (!apiKey) {
    console.error("STEP FAILED:", new Error("GEMINI_API_KEY/LOVABLE_API_KEY missing"));
    return { ...fallback, warning: "IA temporariamente indisponível" };
  }

  try {
    const prompt = `Analise o potencial musical e reputação digital deste fã do Groovium.

Métricas: GRV ${m.grv_balance ?? 0}, missões ${m.missions_completed ?? 0}, NFTs ${m.nft_count ?? 0}, streak ${m.streak ?? 0}, boosts ${m.boosts_active ?? 0}, crates ${m.crates_opened ?? 0}, follows ${m.follows ?? 0}, likes ${m.likes ?? 0}, comentários ${m.comments ?? 0}.
Sinais externos: ETH USD ${ext.eth_usd}, LINK USD ${ext.link_usd}, trending ${ext.trending_name}, música seed ${ext.music_seed}.
Groove Score calculado sem IA: ${score}/1000.

Responda APENAS JSON válido:
{"profile":"rótulo de 2-4 palavras cyberpunk","insight":"1 frase de até 140 caracteres","rank":"Rookie | Rising | Viral | Legendary"}`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "edge-function-fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!r.ok) throw new Error(`Gemini HTTP ${r.status}`);
    const data = await r.json();
    const parsed = extractJson(data?.choices?.[0]?.message?.content ?? "");
    const rank = ["Rookie", "Rising", "Viral", "Legendary"].includes(parsed.rank) ? parsed.rank : fallbackRank;
    return {
      profile: String(parsed.profile ?? FALLBACK_PROFILE).slice(0, 40),
      insight: String(parsed.insight ?? FALLBACK_INSIGHT).slice(0, 200),
      rank,
      ai_ok: true,
    };
  } catch (error) {
    console.error("Gemini failed", error);
    console.error("STEP FAILED:", error);
    return { ...fallback, warning: "IA temporariamente indisponível" };
  }
}

function extractJson(content: string) {
  const cleaned = content.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("Gemini returned non-JSON content");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function fallbackMetrics() {
  return {
    missions_completed: 0,
    nft_count: 0,
    grv_balance: 0,
    streak: 0,
    boosts_active: 0,
    crates_opened: 0,
    follows: 0,
    likes: 0,
    comments: 0,
    badges: 0,
    tips_sent: 0,
  };
}

function normalizeMetrics(data: unknown) {
  const raw = (data ?? {}) as Record<string, unknown>;
  const base = fallbackMetrics();
  for (const key of Object.keys(base)) base[key as keyof typeof base] = Number(raw[key] ?? 0);
  return base;
}

function fallbackExternalSignals(warnings: string[] = []): ExternalSignals {
  return {
    eth_usd: 0,
    ethPrice: 0,
    eth_change_24h: 0,
    link_usd: 0,
    trending_coin: "—",
    trending_name: "Unknown",
    trending: [],
    music_seed: "Unknown",
    artistSeed: "Unknown",
    music_score: 0,
    fetched_at: new Date().toISOString(),
    api_offline: true,
    coingecko_ok: false,
    musicbrainz_ok: false,
    ai_ok: false,
    warnings,
  };
}

function fakeTxHash() {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return "0x" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function fakeBlockNumber() {
  return 18000000 + Math.floor(Math.random() * 1000000);
}

function stringifyError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function successResponse(body: {
  grooveScore: number;
  insight: string;
  profile?: string;
  rank: string;
  externalData: ExternalSignals;
  txHash: string;
  blockNumber?: number;
  syncedAt: string;
  durationMs?: number;
  workflow?: WorkflowStep[];
}) {
  return new Response(JSON.stringify({ success: true, ...body }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}