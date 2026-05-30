// Proof of Support Oracle — Chainlink CRE workflow + REAL Solana Devnet proof
// GRVM Reputation Engine v2 — score 0–1000, 7 ranks, smart actions, humanized AI insight.
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

type Rank =
  | "Rookie" | "Listener" | "Supporter" | "Insider"
  | "Groove Hunter" | "Backstage" | "Legend" | "Genesis Icon";

type Archetype =
  | "Trend Hunter" | "Community Builder" | "Genesis Supporter"
  | "Culture Creator" | "Strategic Observer" | "Backstage Builder";

type AiResult = {
  profile: string; insight: string; rank: Rank; ai_ok: boolean; warning?: string;
  archetype: Archetype; nextAction: string; reason: string;
};

type SmartAction = {
  id: string; action: string; label: string; icon: string;
  reputation_delta: number; category: string; created_at: string;
};

const FALLBACK_INSIGHT = "Seu perfil ainda possui poucos dados — interaja com artistas para acelerar a reputação.";
const FALLBACK_PROFILE = "Groover Rookie";

function rankForScore(score: number): Rank {
  if (score >= 900) return "Genesis Icon";
  if (score >= 800) return "Legend";
  if (score >= 650) return "Backstage";
  if (score >= 500) return "Groove Hunter";
  if (score >= 350) return "Insider";
  if (score >= 200) return "Supporter";
  if (score >= 100) return "Listener";
  return "Rookie";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startedAt = Date.now();
  const workflow: WorkflowStep[] = [];

  try {
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

    // [1] Engagement metrics
    let metrics: Record<string, number> = fallbackMetrics();
    try {
      const { data, error } = await admin.rpc("compute_engagement_metrics", { _uid: uid });
      if (error) throw error;
      metrics = normalizeMetrics(data);
      workflow.push({ name: "Lendo atividade do fã (GRVM)", status: "ok" });
    } catch (error) {
      console.error("[metrics] failed", error);
      workflow.push({ name: "Lendo atividade do fã (GRVM)", status: "fallback", message: stringifyError(error) });
    }

    // [1.5] Smart actions (recent typed events)
    let smartActions: SmartAction[] = [];
    try {
      const { data, error } = await userClient.rpc("get_smart_actions", { _limit: 16 });
      if (error) throw error;
      smartActions = (data as SmartAction[]) ?? [];
      workflow.push({ name: "Mapeando Smart Actions", status: "ok" });
    } catch (error) {
      console.warn("[smart_actions] failed", error);
      workflow.push({ name: "Mapeando Smart Actions", status: "fallback", message: stringifyError(error) });
    }

    // [2] External APIs
    const externalData = await fetchExternalSignals();
    workflow.push({
      name: "APIs externas (CoinGecko · MusicBrainz)",
      status: externalData.api_offline ? "fallback" : "ok",
      message: externalData.warnings.join(" · ") || undefined,
    });

    // [3] Reputation Score 0–1000 — prefer canonical SQL function, fallback to inline.
    // Capture previous score BEFORE this sync for delta + bonus calculation.
    let previousScore = 0;
    try {
      const { data: prev } = await admin
        .from("oracle_activity")
        .select("groove_score")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      previousScore = Number(prev?.groove_score ?? 0);
    } catch (_) { /* ignore */ }

    let grooveScore = 0;
    try {
      const { data, error } = await admin.rpc("compute_reputation_score", { _uid: uid });
      if (error) throw error;
      grooveScore = Number(data ?? 0);
    } catch (error) {
      console.warn("[reputation_score rpc] fallback", error);
      grooveScore = computeReputationScore(metrics, externalData, smartActions);
    }
    const rank = rankForScore(grooveScore);
    workflow.push({ name: "Calculando GRVM Reputation Score", status: "ok" });

    // [4] AI insight + behavioral archetype
    const ai = await runAi(metrics, externalData, grooveScore, rank, smartActions, env.LOVABLE_API_KEY);
    externalData.ai_ok = ai.ai_ok;
    if (ai.warning) externalData.warnings.push(ai.warning);
    workflow.push({ name: "IA · análise comportamental", status: ai.ai_ok ? "ok" : "fallback", message: ai.warning });

    // [5] Oracle hash
    const syncedAt = new Date().toISOString();
    const activityFingerprint = await sha256Hex(
      smartActions.map((a) => `${a.action}:${a.id}`).join("|") || uid,
    );
    const payload = {
      user_id: uid,
      groove_score: grooveScore,
      rank,
      profile: ai.profile,
      activity_hash: activityFingerprint.slice(0, 16),
      timestamp: syncedAt,
      trigger,
    };
    const oracleHash = await sha256Hex(JSON.stringify(payload));
    workflow.push({ name: "Oracle hash (SHA-256)", status: "ok" });

    // [6] Solana memo proof
    const proof = await sendSolanaProof(admin, oracleHash, payload);
    workflow.push({
      name: "Registrando prova na Solana Devnet",
      status: proof.chain === "solana-devnet" ? "ok" : "fallback",
      message: proof.warning,
    });
    if (proof.warning) externalData.warnings.push(proof.warning);

    // [7] Persist
    let dbProof: { tx_hash: string; block_number: number; id?: string } = {
      tx_hash: proof.tx_hash, block_number: proof.slot ?? 0,
    };
    try {
      const { data, error } = await admin.rpc("record_oracle_sync", {
        _uid: uid, _score: grooveScore, _insight: ai.insight, _profile: ai.profile,
        _trigger: trigger, _metrics: metrics, _rank: rank, _external: externalData,
        _tx_hash: proof.tx_hash, _slot: proof.slot, _explorer_url: proof.explorer_url,
        _oracle_hash: oracleHash, _chain: proof.chain,
      });
      if (error) throw error;
      dbProof = data as typeof dbProof;
      workflow.push({ name: "Persistindo histórico", status: "ok" });
    } catch (error) {
      console.error("[persist] failed", error);
      workflow.push({ name: "Persistindo histórico", status: "fallback", message: stringifyError(error) });
    }

    // [8] Bonus GRVM pós-sync (diminishing returns + diversidade)
    const bonus = computeOracleBonus(previousScore, grooveScore, smartActions);
    let bonusAwarded = 0;
    if (bonus > 0) {
      try {
        const { data } = await admin.rpc("award_oracle_bonus", {
          _uid: uid, _bonus: bonus, _sync_id: dbProof.id ?? null,
          _reason: `Bônus Oracle · ${ai.archetype} · +${grooveScore - previousScore} pts`,
        });
        bonusAwarded = Number((data as any)?.awarded ?? 0);
        workflow.push({ name: `Bônus GRVM (+${bonusAwarded})`, status: "ok" });
      } catch (error) {
        console.error("[bonus] failed", error);
        workflow.push({ name: "Bônus GRVM", status: "fallback", message: stringifyError(error) });
      }
    } else {
      workflow.push({ name: "Bônus GRVM", status: "ok", message: "Sem bônus (ação repetitiva)" });
    }

    return successResponse({
      grooveScore, previousScore,
      insight: ai.insight, profile: ai.profile, rank,
      archetype: ai.archetype, nextAction: ai.nextAction, reason: ai.reason,
      smartActions, actionsAnalyzed: smartActions.length,
      activityHash: activityFingerprint, externalData,
      txHash: proof.tx_hash, blockNumber: proof.slot ?? 0, slot: proof.slot,
      chain: proof.chain, explorerUrl: proof.explorer_url, oracleHash,
      syncId: dbProof.id ?? null, bonusGrvm: bonusAwarded,
      syncedAt, durationMs: Date.now() - startedAt, workflow,
    });
  } catch (error) {
    console.error("[oracle] fatal", error);
    return fallbackResponse(workflow, startedAt, [stringifyError(error)]);
  }
});

// ---------------- Solana ----------------

async function getOrCreateServiceKeypair(admin: ReturnType<typeof createClient>): Promise<Keypair> {
  const envKey = Deno.env.get("SOLANA_PRIVATE_KEY");
  if (envKey) {
    try { return Keypair.fromSecretKey(bs58.decode(envKey.trim())); }
    catch (e) { console.error("[solana] invalid env key", e); }
  }
  const { data: row } = await admin.from("service_config").select("value").eq("key", "solana_service_wallet").maybeSingle();
  if (row?.value?.secret_key) {
    try { return Keypair.fromSecretKey(bs58.decode(String(row.value.secret_key))); }
    catch (e) { console.error("[solana] corrupt stored keypair", e); }
  }
  const kp = Keypair.generate();
  await admin.from("service_config").upsert({
    key: "solana_service_wallet",
    value: { public_key: kp.publicKey.toBase58(), secret_key: bs58.encode(kp.secretKey), created_at: new Date().toISOString() },
    updated_at: new Date().toISOString(),
  });
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

    let balance = await connection.getBalance(wallet.publicKey);
    if (balance < 5000) {
      try {
        const sig = await connection.requestAirdrop(wallet.publicKey, LAMPORTS_PER_SOL);
        await connection.confirmTransaction(sig, "confirmed");
        balance = await connection.getBalance(wallet.publicKey);
      } catch (e) { console.error("[solana] airdrop failed", e); }
    }
    if (balance < 5000) {
      return {
        tx_hash: fakeTxHash(), slot: null, explorer_url: null, chain: "simulated",
        warning: `Solana service wallet sem fundos (${wallet.publicKey.toBase58()}).`,
      };
    }

    const memo = JSON.stringify({
      g: "grvm-cre",
      h: oracleHash.slice(0, 32),
      a: (payload.activity_hash as string | undefined)?.slice(0, 16) ?? null,
      s: payload.groove_score,
      r: payload.rank,
      t: payload.timestamp,
    });
    const ix = new TransactionInstruction({
      keys: [], programId: MEMO_PROGRAM_ID, data: new TextEncoder().encode(memo),
    });
    const tx = new Transaction().add(ix);
    const sig = await sendAndConfirmTransaction(connection, tx, [wallet], { commitment: "confirmed" });
    const status = await connection.getSignatureStatus(sig, { searchTransactionHistory: false });
    return {
      tx_hash: sig, slot: status?.value?.slot ?? null,
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

function computeReputationScore(
  m: Record<string, number>,
  ext: ExternalSignals,
  smart: SmartAction[],
): number {
  // base — accumulated GRVM activity
  const base = Math.log10(1 + (m.grv_balance || 0)) * 40;
  // engagement
  const engagement =
    (m.missions_completed || 0) * 12 +
    (m.nft_count || 0) * 18 +
    (m.badges || 0) * 30 +
    (m.boosts_active || 0) * 22 +
    Math.min(m.streak || 0, 30) * 6 +
    (m.crates_opened || 0) * 8;
  // social
  const social =
    (m.follows || 0) * 4 +
    (m.likes || 0) * 1.5 +
    (m.comments || 0) * 2.5 +
    (m.tips_sent || 0) * 14;
  // recency bonus — smart-actions in the last batch
  const recency = Math.min(60, smart.length * 4);
  // market / music context
  const marketBonus = Math.max(-15, Math.min(40, Number(ext.eth_change_24h ?? 0) * 4));
  const musicBonus = Math.min(30, Number(ext.music_score ?? 0) * 0.3);
  // inactivity penalty
  const inactivity = (m.streak || 0) < 1 && smart.length === 0 ? -40 : 0;

  const raw = base + engagement + social + recency + marketBonus + musicBonus + inactivity;
  return Math.max(0, Math.min(1000, Math.round(raw)));
}

function classifyArchetype(
  m: Record<string, number>, smart: SmartAction[], topCat: string,
): { archetype: Archetype; reason: string; nextAction: string } {
  const collectorN = smart.filter(s => s.category === "collector").length;
  const supportN   = smart.filter(s => s.category === "support").length;
  const socialN    = smart.filter(s => s.category === "social").length;
  const creatorN   = smart.filter(s => s.category === "creator").length;
  const engageN    = smart.filter(s => s.category === "engagement").length;

  if ((m.nft_count ?? 0) >= 3 || collectorN >= 4)
    return {
      archetype: "Genesis Supporter",
      reason: "Você coleciona NFTs e abre crates raras antes da maioria.",
      nextAction: "Abra uma Crate Lendária para subir de rank.",
    };
  if ((m.tips_sent ?? 0) >= 2 || supportN >= 3)
    return {
      archetype: "Backstage Builder",
      reason: "Você apoia artistas com tips e resgates VIP.",
      nextAction: "Resgate um perk VIP para fortalecer sua reputação.",
    };
  if (socialN >= 6 || (m.follows ?? 0) >= 5)
    return {
      archetype: "Community Builder",
      reason: "Seu impacto social no Groovium está acima da média.",
      nextAction: "Comente em um post de um artista que você segue.",
    };
  if (creatorN >= 2)
    return {
      archetype: "Culture Creator",
      reason: "Você cria conteúdo e movimenta o ecossistema.",
      nextAction: "Lance um novo drop ou item para sua audiência.",
    };
  if (engageN >= 6 || (m.streak ?? 0) >= 5)
    return {
      archetype: "Trend Hunter",
      reason: "Sua frequência diária mantém o radar afiado.",
      nextAction: "Complete a próxima missão diária para manter o streak.",
    };
  return {
    archetype: "Strategic Observer",
    reason: "Você está acompanhando, mas ainda interagindo pouco.",
    nextAction: "Siga um artista e faça check-in para ativar sua reputação.",
  };
}

export function computeOracleBonus(
  prev: number, next: number, smart: SmartAction[],
): number {
  const delta = next - prev;
  const cats = new Set(smart.map(s => s.category));
  const diversity = cats.size; // 0..6
  // repetição → diminishing returns: se 80%+ vem de 1 categoria, penaliza
  const counts: Record<string, number> = {};
  for (const a of smart) counts[a.category] = (counts[a.category] ?? 0) + 1;
  const total = smart.length || 1;
  const topShare = Math.max(0, ...Object.values(counts)) / total;
  const repetitionPenalty = topShare > 0.8 ? 0.5 : 1;

  const base = Math.max(0, delta) * 0.6 + diversity * 5;
  // Score absoluto também gera um mínimo de 10 para não ser frustrante
  const minimum = next > 0 ? 10 : 0;
  const raw = Math.max(minimum, base * repetitionPenalty);
  return Math.max(0, Math.min(80, Math.round(raw)));
}

async function runAi(
  m: Record<string, number>,
  ext: ExternalSignals,
  score: number,
  rank: Rank,
  smart: SmartAction[],
  apiKey: string,
): Promise<AiResult> {
  const topCats: Record<string, number> = {};
  for (const a of smart) topCats[a.category] = (topCats[a.category] ?? 0) + 1;
  const topCat = Object.entries(topCats).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "engagement";
  const classification = classifyArchetype(m, smart, topCat);

  const fallback: AiResult = {
    profile: classification.archetype,
    insight: classification.reason,
    rank, ai_ok: false,
    archetype: classification.archetype,
    nextAction: classification.nextAction,
    reason: classification.reason,
  };
  if (!apiKey) return { ...fallback, warning: "IA temporariamente indisponível" };

  try {
    const prompt = `Você é o Oracle do Groovium, um motor de reputação musical Web3. Analise o comportamento do fã abaixo.
Métricas: GRV ${m.grv_balance ?? 0}, missões ${m.missions_completed ?? 0}, NFTs ${m.nft_count ?? 0}, streak ${m.streak ?? 0}, boosts ${m.boosts_active ?? 0}, tips ${m.tips_sent ?? 0}, follows ${m.follows ?? 0}, likes ${m.likes ?? 0}, badges ${m.badges ?? 0}.
Categoria dominante: ${topCat}. Score: ${score}/1000. Rank: ${rank}. Smart Actions recentes: ${smart.length}.
Arquétipo sugerido (regras): ${classification.archetype}.
Classifique o fã em UM destes arquétipos: Trend Hunter, Community Builder, Genesis Supporter, Culture Creator, Strategic Observer, Backstage Builder.
NÃO invente números. NÃO use jargão cripto/finance. Tudo em PT-BR.
Responda APENAS JSON válido:
{"archetype":"<um dos 6>","profile":"2-4 palavras cyberpunk","insight":"frase humana inspiradora até 140 chars","reason":"por que o score está nesse nível até 120 chars","nextAction":"recomendação curta de próxima ação até 100 chars"}`;
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
    const allowed: Archetype[] = ["Trend Hunter","Community Builder","Genesis Supporter","Culture Creator","Strategic Observer","Backstage Builder"];
    const arch = allowed.includes(parsed.archetype) ? parsed.archetype : classification.archetype;
    return {
      profile: String(parsed.profile ?? arch).slice(0, 40),
      insight: String(parsed.insight ?? classification.reason).slice(0, 200),
      reason: String(parsed.reason ?? classification.reason).slice(0, 160),
      nextAction: String(parsed.nextAction ?? classification.nextAction).slice(0, 140),
      archetype: arch as Archetype,
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
    grooveScore: 0, previousScore: 0, insight: FALLBACK_INSIGHT, profile: FALLBACK_PROFILE, rank: "Rookie" as Rank,
    archetype: "Strategic Observer", nextAction: "Faça login e siga um artista para começar.", reason: "Sem dados suficientes para análise.",
    smartActions: [], actionsAnalyzed: 0, activityHash: null,
    externalData: ext, txHash: fakeTxHash(), blockNumber: 0, slot: null,
    chain: "simulated", explorerUrl: null, oracleHash: null, syncId: null, bonusGrvm: 0,
    syncedAt: new Date().toISOString(), durationMs: Date.now() - startedAt,
    workflow: workflow.length ? workflow : [{ name: "Oracle fallback", status: "fallback", message: warnings.join(" · ") }],
  });
}
