#!/usr/bin/env node
import { MultiHopperClient } from "../src/client.js";

const args = process.argv.slice(2);
const command = args[0];

function printHelp() {
  console.log(`
MultiHopper CLI - Private Multi-Hop Routing on Solana
Usage:
  multihopper estimate --amount <val> --token <USDC|SOL|USDT> [--hops <n>]
  multihopper route --from <pubkey> --to <pubkey> --amount <val> --token <USDC|SOL|USDT> [--hops <n>]
  multihopper info
`);
}

function parseArg(flag) {
  const idx = args.indexOf(flag);
  return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
}

const client = new MultiHopperClient();

if (!command || command === "--help" || command === "-h" || command === "help") {
  printHelp();
  process.exit(0);
}

if (command === "info") {
  console.log(JSON.stringify({
    service: "MultiHopper Solana Private Routing",
    protocolFeeBps: 50,
    builderRevenueShareBps: 25,
    supportedTokens: ["USDC", "SOL", "USDT"]
  }, null, 2));
  process.exit(0);
}

if (command === "estimate") {
  const amount = parseArg("--amount") || "100";
  const token = parseArg("--token") || "USDC";
  const hops = Number(parseArg("--hops") || "3");

  try {
    const est = client.estimateFees({ amount, tokenSymbol: token, hops });
    console.log("=== MultiHopper Fee & Privacy Estimation ===");
    console.log(JSON.stringify(est, null, 2));
  } catch (err) {
    console.error("Erro:", err.message);
    process.exit(1);
  }
} else if (command === "route") {
  const from = parseArg("--from") || "DemoSender11111111111111111111111111111111";
  const to = parseArg("--to") || "DemoRecipient2222222222222222222222222222222";
  const amount = parseArg("--amount") || "50";
  const token = parseArg("--token") || "USDC";
  const hops = Number(parseArg("--hops") || "3");

  try {
    const plan = client.createPrivateTransferPlan({
      sender: from,
      recipient: to,
      amount,
      tokenSymbol: token,
      hops
    });
    console.log("=== MultiHopper Private Route Plan Generated ===");
    console.log(JSON.stringify(plan, null, 2));
  } catch (err) {
    console.error("Erro:", err.message);
    process.exit(1);
  }
} else {
  console.error(`Comando desconhecido: ${command}`);
  printHelp();
  process.exit(1);
}
