#!/usr/bin/env node
// Generate a Solana service wallet for the Groove Oracle.
// Usage: node chainlink-cre/scripts/generate-wallet.js
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

const kp = Keypair.generate();
console.log("PUBLIC KEY :", kp.publicKey.toBase58());
console.log("PRIVATE KEY:", bs58.encode(kp.secretKey));
console.log("\nFund it with: solana airdrop 1 " + kp.publicKey.toBase58() + " --url devnet");
