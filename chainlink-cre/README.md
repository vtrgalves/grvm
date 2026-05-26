# Groovium Chainlink CRE — Groove Oracle

Hybrid Oracle workflow that calculates a **Groove Score** (Web2 reputation) and
anchors a SHA-256 **Proof of Support** on **Solana Devnet** via the Memo Program.

## Architecture

```
[ Supabase metrics ] ─┐
[ CoinGecko / MusicBrainz ] ─┤─► [ Groove Score ] ─► [ Lovable AI ] ─► [ Solana Memo TX ] ─► [ oracle_activity ]
```

- **Web2:** GRVM economy, boosts, crates, missions, NFT-like items.
- **Web3:** reputation only — Groove Score + SHA-256 hash → real Solana Devnet TXID.

## Files

- `workflows/groove-oracle.yaml` — CRE workflow definition.
- `oracle/score.js` — Groove Score calculation.
- `oracle/solana-proof.js` — Memo program transaction.
- `oracle/onchain.js` — legacy EVM stub (kept for reference).
- `prompts/groove-oracle.system.md` — AI prompt.
- `scripts/generate-wallet.js` — generate a Solana service wallet locally.
- `scripts/simulate.sh` — local dry-run.

## Commands

```bash
# Generate a wallet (run once)
node chainlink-cre/scripts/generate-wallet.js

# Local simulate
cre workflow simulate ./workflows/groove-oracle.yaml --input scripts/sample-input.json

# Deploy (sandbox / devnet)
cre workflow deploy ./workflows/groove-oracle.yaml --env devnet
```

## Environment

| Var                  | Purpose                                         |
| -------------------- | ----------------------------------------------- |
| `SOLANA_RPC_URL`     | Solana RPC (default `https://api.devnet.solana.com`) |
| `SOLANA_PRIVATE_KEY` | base58 secret key for the service wallet         |
| `LOVABLE_API_KEY`    | Lovable AI Gateway (Gemini)                     |

Only the backend / edge function has the private key — never the client.

## Live integration

The edge function `supabase/functions/oracle-analyze` mirrors this workflow at
runtime and writes the resulting Solana TXID, slot and explorer URL into the
`oracle_activity` table.
