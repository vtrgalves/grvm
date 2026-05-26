# Groovium · Chainlink CRE Integration — "Proof of Support Oracle"

This folder contains the **Chainlink Runtime Environment (CRE)** workflow that powers Groovium's `Proof of Support Oracle` feature.

## What it does

```
Groovium DB (Supabase)
        ↓
   CRE Workflow
        ↓
  External API (CoinGecko)
        ↓
   AI (Lovable AI Gateway / Gemini)
        ↓
   Groove Score (0–10)
        ↓
   Simulated onchain proof  →  Dashboard live update
```

When a user completes a mission, opens a crate, or hits **Sync Oracle** in the Dashboard, the CRE workflow:

1. Reads engagement metrics from Supabase (`compute_engagement_metrics` RPC).
2. Fetches a real external API datapoint (CoinGecko trending).
3. Calls an LLM (Lovable AI Gateway → Gemini 3 Flash) to classify the fan and generate an insight.
4. Computes a deterministic **Groove Score**.
5. Writes a simulated onchain proof (`tx_hash`, `block_number`) into `oracle_activity`.

## Structure

```
/chainlink-cre
  /workflows         # CRE workflow YAML
  /scripts           # CRE CLI helpers (simulate/deploy)
  /oracle            # Score logic + simulated onchain proof
  /prompts           # System prompts for the AI step
```

## CRE CLI usage

```bash
# install
npm install -g @chainlink/cre-cli

# simulate locally
cre workflow simulate ./workflows/groove-oracle.yaml --input ./scripts/sample-input.json

# deploy
cre workflow deploy ./workflows/groove-oracle.yaml
```

The same business logic lives in `supabase/functions/oracle-analyze/index.ts` so the workflow can also run server-side without CRE for fallback.

## Hackathon scope

- ✅ CRE workflow orchestrating DB + external API + AI + onchain-proof
- ✅ Real AI integration (Lovable AI Gateway)
- ✅ Real external API (CoinGecko)
- ✅ Live dashboard updates (Supabase realtime)
- 🧪 Onchain proof is simulated (tx hash + block number) — production target: Chainlink Functions + EVM contract emitting `GrooveScoreUpdated(address fan, uint256 score)`.
