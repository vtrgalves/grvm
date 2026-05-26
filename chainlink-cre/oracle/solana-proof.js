// Solana Devnet Memo Proof — Chainlink CRE step
// Anchors the reputational payload SHA-256 as an on-chain memo transaction.
import {
  Connection, Keypair, PublicKey, Transaction, TransactionInstruction,
  sendAndConfirmTransaction, LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import bs58 from "bs58";

const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

export async function run({ memo, cluster = "devnet" } = {}) {
  const rpc = process.env.SOLANA_RPC_URL || `https://api.${cluster}.solana.com`;
  const secret = process.env.SOLANA_PRIVATE_KEY;
  if (!secret) throw new Error("SOLANA_PRIVATE_KEY missing");

  const wallet = Keypair.fromSecretKey(bs58.decode(secret.trim()));
  const connection = new Connection(rpc, "confirmed");

  let balance = await connection.getBalance(wallet.publicKey);
  if (balance < 5000) {
    const sig = await connection.requestAirdrop(wallet.publicKey, LAMPORTS_PER_SOL);
    await connection.confirmTransaction(sig, "confirmed");
    balance = await connection.getBalance(wallet.publicKey);
  }

  const ix = new TransactionInstruction({
    keys: [],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(JSON.stringify(memo)),
  });
  const tx = new Transaction().add(ix);
  const signature = await sendAndConfirmTransaction(connection, tx, [wallet], { commitment: "confirmed" });
  const status = await connection.getSignatureStatus(signature);

  return {
    signature,
    slot: status?.value?.slot ?? null,
    explorer_url: `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`,
    wallet: wallet.publicKey.toBase58(),
    chain: `solana-${cluster}`,
  };
}
