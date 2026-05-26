// Simulated onchain proof emitter.
// In production this step would call a Chainlink Functions consumer
// contract that emits `GrooveScoreUpdated(address fan, uint256 score, bytes32 insightHash)`.
//
// For the hackathon MVP we generate a deterministic-looking tx hash + block.

import { randomBytes } from "node:crypto";

export default function emit(input) {
  const txHash = "0x" + randomBytes(20).toString("hex");
  const blockNumber = 18_000_000 + Math.floor(Math.random() * 1_000_000);

  return {
    tx_hash: txHash,
    block_number: blockNumber,
    chain: "ethereum-sepolia",
    contract: "0xGroovium000Oracle0000000000000000000000",
    event: "GrooveScoreUpdated",
    payload: {
      fan: input.user_id,
      score: input.score,
      profile: input.profile,
    },
    emitted_at: new Date().toISOString(),
  };
}
