// Proof of Support Oracle — Chainlink CRE workflow + REAL Solana Devnet proof
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
} from "npm:@solana/web3.js@1.95.3";
import bs58 from "npm:bs58@5.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SOLANA_RPC = Deno.env.get("SOLANA_RPC_URL") || "https://api.devnet.solana.com";
const SOLANA_CLUSTER = "devnet";
const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

type StepStatus = "ok" | "fallback" | "failed";
type WorkflowStep = { name: string; status: StepStatus; message?: string };

type ExternalSignals = {
  eth_usd: number; ethPrice: number; eth_change_24h: number; link_usd: number;
  trending_coin: string; trending_name: string; trending: string[];
  music_seed: string; artistSeed: string; music_score: number;
  fetched_at: string; api_offline: boolean;
  coingecko_ok: boolean; musicbrainz_ok: boolean; ai_ok?: boolean;
  warnings: string[];
};

type AiResult = { profile: string; insight: string; rank: string; ai_ok: boolean; warning?: string };

const FALLBACK_INSIGHT = "Seu perfil ainda possui poucos dados para análise avançada.";
const FALLBACK_PROFILE = "Groover Rookie";
const FALLBACK_RANK = "Rookie";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startedAt = Date.now();
  const workflow: WorkflowStep[] = [];

  try {
    console.log("[1] Starting Oracle CRE workflow");
    if (req.method !== "POST") {
      return fallbackResponse(workflow, startedAt, ["Método HTTP inválido"]);
    }

    const env = readEnv();
    const auth = req.headers.get("Authorization");
    const body = await req.json().catch(() => ({}));
    const trigger = typeof body?.trigger === "string" ? body.trigger : "manual_sync";

    if (!env.SUPABASE_URL || !env.SERVICE_KEY || !env.ANON_KEY) {
      return fallbackResponse(workflow, startedAt, ["Configuração de backend indisponível"]);
    }
    if (!auth?.startsWith("Bearer ")) {
      return fallbackResponse(workflow, startedAt, ["Sessão não autenticada"]);
    }

    const userClient = createClient(env.SUPABASE_URL, env.ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: claims } = await userClient.auth.getClaims(auth.replace("Bearer ", ""));
    const uid = claims?.claims?.sub as string | undefined;
    if (!uid) return fallbackResponse(workflow, startedAt, ["Token sem usuário válido"]);

    const admin = createClient(env.SUPABASE_URL, env.SERVICE_KEY);

    // [2] Engagement metrics
    let metrics: Record<string, number> = fallbackMetrics();
    try {
      const { data, error } = await admin.rpc("compute_engagement_metrics", { _uid: uid });
      if (error) throw error;
      metrics = normalizeMetrics(data);
      workflow.push({ name: "Engagement metrics", status: "ok" });
    } catch (error) {
      console.error("[metrics] failed", error);
      workflow.push({ name: "Engagement metrics", status: "fallback", message: stringifyError(error) });
    }

    // [3] External APIs
    const externalData = await fetchExternalSignals();
    workflow.push({
      name: "External APIs (CoinGecko · MusicBrainz)",
      status: externalData.api_offline ? "fallback" : "ok",
      message: externalData.warnings.join(" · ") || undefined,
    });

    // [4] Groove Score
    const grooveScore = computeGrooveScore(metrics, externalData);
    workflow.push({ name: "Groove Score (0-1000)", status: "ok" });

    // [5] AI
    const ai = await runAi(metrics, externalData, grooveScore, env.LOVABLE_API_KEY);
    externalData.ai_ok = ai.ai_ok;
    if (ai.warning) externalData.warnings.push(ai.warning);
    workflow.push({ name: "AI · Gemini", status: ai.ai_ok ? "ok" : "fallback", message: ai.warning });

    // [6] Oracle hash
    const syncedAt = new Date().toISOString();
    const payload = {
      user_id: uid,
      groove_score: grooveScore,
      rank: ai.rank,
      profile: ai.profile,
      timestamp: syncedAt,
      trigger,
    };
    const oracleHash = await sha256Hex(JSON.stringify(payload));
    workflow.push({ name: "Oracle hash (SHA-256)", status: "ok" });

    // [7] Solana Devnet memo proof
    const proof = await sendSolanaProof(admin, oracleHash, payload);
    workflow.push({
      name: "Solana Devnet · Memo Proof",
      status: proof.chain === "solana-devnet" ? "ok" : "fallback",
      message: proof.warning,
    });
    if (proof.warning) externalData.warnings.push(proof.warning);

    // [8] Persist
    let dbProof: { tx_hash: string; block_number: number; id?: string } = {
      tx_hash: proof.tx_hash, block_number: proof.slot ?? 0,
    };
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
        _tx_hash: proof.tx_hash,
        _slot: proof.slot,
        _explorer_url: proof.explorer_url,
        _oracle_hash: oracleHash,
        _chain: proof.chain,
      });
      if (error) throw error;
      dbProof = data as typeof dbProof;
      workflow.push({ name: "Persist oracle_activity", status: "ok" });
    } catch (error) {
      console.error("[persist] failed", error);
      workflow.push({ name: "Persist oracle_activity", status: "fallback", message: stringifyError(error) });
    }

    return successResponse({
      grooveScore, insight: ai.insight, profile: ai.profile, rank: ai.rank,
      externalData,
      txHash: proof.tx_hash,
      blockNumber: proof.slot ?? 0,
      slot: proof.slot,
      chain: proof.chain,
      explorerUrl: proof.explorer_url,
      oracleHash,
      syncedAt,
      durationMs: Date.now() - startedAt,
      workflow,
    });
  } catch (error) {
    console.error("[oracle] fatal", error);
    return fallbackResponse(workflow, startedAt, [stringifyError(error)]);
  }
});

// ---------------- Solana ----------------

async function getOrCreateServiceKeypair(admin: ReturnType<typeof createClient>): Promise<Keypair> {
  // 1. Prefer env var if provided
  const envKey = Deno.env.get("SOLANA_PRIVATE_KEY");
  if (envKey) {
    try {
      return Keypair.fromSecretKey(bs58.decode(envKey.trim()));
    } catch (e) {
      console.error("[solana] invalid SOLANA_PRIVATE_KEY env, falling back to DB keypair", e);
    }
  }
  // 2. Read from service_config
  const { data: row } = await admin.from("service_config").select("value").eq("key", "solana_service_wallet").maybeSingle();
  if (row?.value?.secret_key) {
    try {
      return Keypair.fromSecretKey(bs58.decode(String(row.value.secret_key)));
    } catch (e) {
      console.error("[solana] corrupt stored keypair, regenerating", e);
    }
  }
  // 3. Generate + persist
  const kp = Keypair.generate();
  const secret = bs58.encode(kp.secretKey);
  await admin.from("service_config").upsert({
    key: "solana_service_wallet",
    value: { public_key: kp.publicKey.toBase58(), secret_key: secret, created_at: new Date().toISOString() },
    updated_at: new Date().toISOString(),
  });
  console.log("[solana] generated new service wallet", kp.publicKey.toBase58());
  return kp;
}

async function sendSolanaProof(
  admin: ReturnType<typeof createClient>,
  oracleHash: string,
  payload: Record<string, unknown>,
): Promise<{ tx_hash: string; slot: number | null; explorer_url: string | null; chain: string; warning?: string }> {
  try {
    const connection = new Connection(SOLANA_RPC, "confirmed");
    const wallet = await getOrCreateServiceKeypair(admin);

    // Ensure balance — try airdrop on devnet if empty
    let balance = await connection.getBalance(wallet.publicKey);
    if (balance < 5000) {
      try {
        console.log("[solana] requesting airdrop for", wallet.publicKey.toBase58());
        const sig = await connection.requestAirdrop(wallet.publicKey, LAMPORTS_PER_SOL);
        await connection.confirmTransaction(sig, "confirmed");
        balance = await connection.getBalance(wallet.publicKey);
      } catch (e) {
        console.error("[solana] airdrop failed", e);
      }
    }
    if (balance < 5000) {
      return {
        tx_hash: fakeTxHash(), slot: null, explorer_url: null, chain: "simulated",
        warning: `Solana service wallet sem fundos (${wallet.publicKey.toBase58()}). Faça airdrop devnet.`,
      };
    }

    const memo = JSON.stringify({
      g: "groovium-cre",
      h: oracleHash.slice(0, 32),
      s: payload.groove_score,
      r: payload.rank,
      t: payload.timestamp,
    });
    const ix = new TransactionInstruction({
      keys: [],
      programId: MEMO_PROGRAM_ID,
      data: new TextEncoder().encode(memo),
    });
    const tx = new Transaction().add(ix);
    const sig = await sendAndConfirmTransaction(connection, tx, [wallet], { commitment: "confirmed" });
    const status = await connection.getSignatureStatus(sig, { searchTransactionHistory: false });
    const slot = status?.value?.slot ?? null;
    return {
      tx_hash: sig,
      slot,
      explorer_url: `https://explorer.solana.com/tx/${sig}?cluster=${SOLANA_CLUSTER}`,
      chain: "solana-devnet",
    };
  } catch (e) {
    console.error("[solana] proof failed", e);
    return {
      tx_hash: fakeTxHash(), slot: null, explorer_url: null, chain: "simulated",
      warning: `Solana proof fallback: ${stringifyError(e)}`,
    };
  }
}

// ---------------- helpers ----------------

function readEnv() {
  return {
    LOVABLE_API_KEY: Deno.env.get("LOVABLE_API_KEY") ?? "",
    SUPABASE_URL: Deno.env.get("SUPABASE_URL") ?? "",
    ANON_KEY: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    SERVICE_KEY: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  };
}

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function fetchExternalSignals(): Promise<ExternalSignals> {
  const warnings: string[] = [];
  let price: any = null, trend: any = null, music: any = null;
  try {
    const r = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum,chainlink&vs_currencies=usd&include_24hr_change=true");
    if (!r.ok) throw new Error(`CoinGecko price HTTP ${r.status}`);
    price = await r.json();
  } catch (e) { console.error("[coingecko price]", e); warnings.push("External API Offline"); }
  try {
    const r = await fetch("https://api.coingecko.com/api/v3/search/trending");
    if (!r.ok) throw new Error(`CoinGecko trending HTTP ${r.status}`);
    trend = await r.json();
  } catch (e) { console.error("[coingecko trending]", e); warnings.push("Trending fallback ativo"); }
  try {
    const r = await fetch("https://musicbrainz.org/ws/2/artist/?query=tag:electronic&fmt=json&limit=1", {
      headers: { "User-Agent": "Groovium-Oracle/1.0 (https://grvm.lovable.app)" },
    });
    if (!r.ok) throw new Error(`MusicBrainz HTTP ${r.status}`);
    music = await r.json();
  } catch (e) { console.error("[musicbrainz]", e); warnings.push("MusicBrainz fallback ativo"); }

  const ethUsd = Number(price?.ethereum?.usd ?? 0);
  const change = Number(price?.ethereum?.usd_24h_change ?? 0);
  const linkUsd = Number(price?.chainlink?.usd ?? 0);
  const trending = Array.isArray(trend?.coins)
    ? trend.coins.slice(0, 3).map((c: any) => String(c?.item?.symbol ?? "")).filter(Boolean)
    : [];
  const artistSeed = String(music?.artists?.[0]?.name ?? "Unknown");
  const musicScore = Number(music?.artists?.[0]?.score ?? 0);
  const coingeckoOk = Boolean(price || trend);
  const musicbrainzOk = artistSeed !== "Unknown";
  return {
    eth_usd: ethUsd, ethPrice: ethUsd, eth_change_24h: change, link_usd: linkUsd,
    trending_coin: trending[0] ?? "—",
    trending_name: trend?.coins?.[0]?.item?.name ?? "Unknown",
    trending,
    music_seed: artistSeed, artistSeed, music_score: musicScore,
    fetched_at: new Date().toISOString(),
    api_offline: !coingeckoOk || !musicbrainzOk,
    coingecko_ok: coingeckoOk, musicbrainz_ok: musicbrainzOk,
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

async function runAi(m: Record<string, number>, ext: ExternalSignals, score: number, apiKey: string): Promise<AiResult> {
  const fallbackRank = score >= 800 ? "Legendary" : score >= 550 ? "Viral" : score >= 300 ? "Rising" : FALLBACK_RANK;
  const fallback = { profile: FALLBACK_PROFILE, insight: FALLBACK_INSIGHT, rank: fallbackRank, ai_ok: false };
  if (!apiKey) return { ...fallback, warning: "IA temporariamente indisponível" };
  try {
    const prompt = `Analise reputação musical Groovium.
Métricas: GRV ${m.grv_balance ?? 0}, missões ${m.missions_completed ?? 0}, NFTs ${m.nft_count ?? 0}, streak ${m.streak ?? 0}, boosts ${m.boosts_active ?? 0}.
Sinais: ETH ${ext.eth_usd}, trending ${ext.trending_name}.
Score: ${score}/1000.
Responda APENAS JSON: {"profile":"2-4 palavras cyberpunk","insight":"frase até 140 chars","rank":"Rookie|Rising|Viral|Legendary"}`;
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "edge-function-fetch" },
      body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages: [{ role: "user", content: prompt }] }),
    });
    if (!r.ok) throw new Error(`Gemini HTTP ${r.status}`);
    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content ?? "";
    const cleaned = content.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
    const s = cleaned.indexOf("{"), e = cleaned.lastIndexOf("}");
    if (s === -1 || e === -1) throw new Error("Non-JSON AI response");
    const parsed = JSON.parse(cleaned.slice(s, e + 1));
    const rank = ["Rookie", "Rising", "Viral", "Legendary"].includes(parsed.rank) ? parsed.rank : fallbackRank;
    return {
      profile: String(parsed.profile ?? FALLBACK_PROFILE).slice(0, 40),
      insight: String(parsed.insight ?? FALLBACK_INSIGHT).slice(0, 200),
      rank, ai_ok: true,
    };
  } catch (e) {
    console.error("[ai]", e);
    return { ...fallback, warning: "IA temporariamente indisponível" };
  }
}

function fallbackMetrics() {
  return { missions_completed: 0, nft_count: 0, grv_balance: 0, streak: 0, boosts_active: 0, crates_opened: 0, follows: 0, likes: 0, comments: 0, badges: 0, tips_sent: 0 };
}
function normalizeMetrics(data: unknown) {
  const raw = (data ?? {}) as Record<string, unknown>;
  const base = fallbackMetrics();
  for (const k of Object.keys(base)) (base as any)[k] = Number(raw[k] ?? 0);
  return base;
}
function fallbackExternalSignals(warnings: string[] = []): ExternalSignals {
  return {
    eth_usd: 0, ethPrice: 0, eth_change_24h: 0, link_usd: 0,
    trending_coin: "—", trending_name: "Unknown", trending: [],
    music_seed: "Unknown", artistSeed: "Unknown", music_score: 0,
    fetched_at: new Date().toISOString(), api_offline: true,
    coingecko_ok: false, musicbrainz_ok: false, ai_ok: false, warnings,
  };
}
function fakeTxHash() {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return "0x" + Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
function stringifyError(e: unknown) {
  if (e instanceof Error) return e.message;
  try { return JSON.stringify(e); } catch { return String(e); }
}
function successResponse(payload: Record<string, unknown>) {
  return new Response(JSON.stringify({ success: true, ...payload }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function fallbackResponse(workflow: WorkflowStep[], startedAt: number, warnings: string[]) {
  const ext = fallbackExternalSignals(warnings);
  return successResponse({
    grooveScore: 0, insight: FALLBACK_INSIGHT, profile: FALLBACK_PROFILE, rank: FALLBACK_RANK,
    externalData: ext, txHash: fakeTxHash(), blockNumber: 0, slot: null,
    chain: "simulated", explorerUrl: null, oracleHash: null,
    syncedAt: new Date().toISOString(), durationMs: Date.now() - startedAt,
    workflow: workflow.length ? workflow : [{ name: "Oracle fallback", status: "fallback", message: warnings.join(" · ") }],
  });
}
