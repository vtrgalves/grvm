// Frontend Solana helpers — read-only. Service wallet & signing live in the edge function.
export const SOLANA_CLUSTER = "devnet" as const;
export const SOLANA_RPC_URL = "https://api.devnet.solana.com";

export const explorerTxUrl = (signature: string) =>
  `https://explorer.solana.com/tx/${signature}?cluster=${SOLANA_CLUSTER}`;

export const explorerAddressUrl = (address: string) =>
  `https://explorer.solana.com/address/${address}?cluster=${SOLANA_CLUSTER}`;

export const isSolanaSignature = (s?: string | null) =>
  !!s && /^[1-9A-HJ-NP-Za-km-z]{60,100}$/.test(s);
