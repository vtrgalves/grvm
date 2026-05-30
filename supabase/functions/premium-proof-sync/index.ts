// Premium Proof Sync — sends INDIVIDUAL Solana Devnet memos for every pending premium Smart Action.
// Triggered by the authenticated user; the edge function uses the service-role key to read the queue
// and write back the on-chain tx_hash per action via `mark_premium_proof`.
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
const MAX_PER_CALL = 5;

type PendingRow = {
  id: string; user_id: string; action: string; label: string;
  points: number; created_at: string;
};

type Result = {
  action_id: string; action: string; label: string;
  tx_hash: string; explorer_url: string | null; chain: string; warning?: string;
};

function fakeTxHash() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function getServiceKeypair(admin: ReturnType<typeof createClient>): Promise<Keypair | null> {
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
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const auth = req.headers.get("Authorization") ?? "";

  if (!SUPABASE_URL || !ANON || !SERVICE || !auth.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: auth } } });
  const { data: claims } = await userClient.auth.getClaims(auth.replace("Bearer ", ""));
  const uid = claims?.claims?.sub as string | undefined;
  if (!uid) {
    return new Response(JSON.stringify({ error: "no_user" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const admin = createClient(SUPABASE_URL, SERVICE);

  // Pull only THIS user's pending premium proofs (limit to keep request bounded)
  const { data: pending, error } = await admin
    .from("smart_actions")
    .select("id, user_id, action, label, points, created_at")
    .eq("user_id", uid).eq("premium", true).eq("oracle_synced", false)
    .order("created_at", { ascending: true })
    .limit(MAX_PER_CALL);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const queue = (pending as PendingRow[]) ?? [];
  if (queue.length === 0) {
    return new Response(JSON.stringify({ processed: 0, results: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const wallet = await getServiceKeypair(admin);
  const connection = wallet ? new Connection(SOLANA_RPC, "confirmed") : null;
  let balance = 0;
  if (wallet && connection) {
    try {
      balance = await connection.getBalance(wallet.publicKey);
      if (balance < 5000 * queue.length) {
        try {
          const sig = await connection.requestAirdrop(wallet.publicKey, LAMPORTS_PER_SOL);
          await connection.confirmTransaction(sig, "confirmed");
          balance = await connection.getBalance(wallet.publicKey);
        } catch (e) { console.warn("[premium-proof] airdrop failed", e); }
      }
    } catch (e) { console.warn("[premium-proof] balance fetch", e); }
  }

  const results: Result[] = [];
  for (const row of queue) {
    let tx_hash = fakeTxHash();
    let explorer_url: string | null = null;
    let chain = "simulated";
    let warning: string | undefined;

    if (wallet && connection && balance >= 5000) {
      try {
        const memo = JSON.stringify({
          g: "grvm-proof",
          a: row.action,
          id: row.id.slice(0, 12),
          p: row.points,
          t: row.created_at,
        });
        const ix = new TransactionInstruction({
          keys: [], programId: MEMO_PROGRAM_ID, data: new TextEncoder().encode(memo),
        });
        const tx = new Transaction().add(ix);
        const sig = await sendAndConfirmTransaction(connection, tx, [wallet], { commitment: "confirmed" });
        tx_hash = sig;
        explorer_url = `https://explorer.solana.com/tx/${sig}?cluster=${SOLANA_CLUSTER}`;
        chain = "solana-devnet";
        balance -= 5000;
      } catch (e) {
        console.error("[premium-proof] memo send failed", e);
        warning = `Solana fallback: ${(e as Error)?.message ?? "unknown"}`;
      }
    } else if (!wallet) {
      warning = "Solana service wallet não configurada — proof simulada.";
    } else {
      warning = "Saldo insuficiente na devnet wallet — proof simulada.";
    }

    const { error: markErr } = await admin.rpc("mark_premium_proof", {
      _action_id: row.id, _tx_hash: tx_hash, _explorer_url: explorer_url, _chain: chain,
    });
    if (markErr) warning = (warning ? warning + " · " : "") + markErr.message;

    results.push({ action_id: row.id, action: row.action, label: row.label, tx_hash, explorer_url, chain, warning });
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
