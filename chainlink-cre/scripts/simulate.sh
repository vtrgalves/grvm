#!/usr/bin/env bash
# Local CRE simulation helper.
# Requires: npm install -g @chainlink/cre-cli
set -euo pipefail

cd "$(dirname "$0")/.."

echo "▶ Simulating Groovium Proof of Support Oracle workflow..."
cre workflow simulate ./workflows/groove-oracle.yaml \
  --input ./scripts/sample-input.json \
  --secret SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-test}" \
  --env SUPABASE_URL="${SUPABASE_URL:-https://example.supabase.co}"
