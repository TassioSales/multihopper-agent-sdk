#!/usr/bin/env node
import readline from "node:readline";
import { MultiHopperClient } from "../src/client.js";

const client = new MultiHopperClient();

const TOOLS = [
  {
    name: "multihopper_estimate_transfer",
    description: "Estima taxas de protocolo (0.5%), parcelas de receita do builder (0.25%) e pontuação de privacidade para transferências privadas na Solana via MultiHopper.",
    inputSchema: {
      type: "object",
      properties: {
        amount: { type: "number", description: "Valor a transferir (ex: 100)" },
        tokenSymbol: { type: "string", enum: ["USDC", "SOL", "USDT"], description: "Símbolo do token" },
        hops: { type: "number", default: 3, description: "Número de saltos intermediários (1 a 5)" }
      },
      required: ["amount", "tokenSymbol"]
    }
  },
  {
    name: "multihopper_plan_private_route",
    description: "Cria um plano completo de roteamento privado MultiHopper desvinculando remetente e destinatário na blockchain Solana usando Token-2022.",
    inputSchema: {
      type: "object",
      properties: {
        sender: { type: "string", description: "Endereço público do remetente na Solana" },
        recipient: { type: "string", description: "Endereço público do destinatário na Solana" },
        amount: { type: "number", description: "Quantidade de tokens" },
        tokenSymbol: { type: "string", enum: ["USDC", "SOL", "USDT"], description: "Símbolo do token" },
        hops: { type: "number", default: 3, description: "Quantidade de saltos na rota" }
      },
      required: ["sender", "recipient", "amount", "tokenSymbol"]
    }
  }
];

function handleToolCall(name, args) {
  if (name === "multihopper_estimate_transfer") {
    return client.estimateFees(args);
  }
  if (name === "multihopper_plan_private_route") {
    return client.createPrivateTransferPlan(args);
  }
  throw new Error(`Ferramenta desconhecida: ${name}`);
}

// Interface de Stdio MCP JSON-RPC
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });

rl.on("line", (line) => {
  if (!line.trim()) return;
  try {
    const req = JSON.parse(line);
    if (req.method === "tools/list") {
      const resp = { jsonrpc: "2.0", id: req.id, result: { tools: TOOLS } };
      console.log(JSON.stringify(resp));
    } else if (req.method === "tools/call") {
      const { name, arguments: toolArgs } = req.params;
      const res = handleToolCall(name, toolArgs);
      const resp = { jsonrpc: "2.0", id: req.id, result: { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] } };
      console.log(JSON.stringify(resp));
    } else {
      const resp = { jsonrpc: "2.0", id: req.id, result: {} };
      console.log(JSON.stringify(resp));
    }
  } catch (err) {
    const resp = { jsonrpc: "2.0", id: null, error: { code: -32603, message: err.message } };
    console.log(JSON.stringify(resp));
  }
});
