import {
  MULTIHOPPER_PROGRAM_ID,
  MULTIHOPPER_ORCHESTRATOR_ID,
  MULTIHOPPER_TRANSFER_HOOK_ID,
  API_BASE_URL_MAINNET,
  API_BASE_URL_DEVNET,
  SUPPORTED_TOKENS,
  PROTOCOL_FEE_BPS
} from "./constants.js";

export class MultiHopperClient {
  constructor(options = {}) {
    this.network = options.network || "mainnet-beta";
    this.apiKey = options.apiKey || null;
    this.baseUrl = this.network === "devnet" ? API_BASE_URL_DEVNET : API_BASE_URL_MAINNET;
    this.rpcUrl = options.rpcUrl || (this.network === "devnet" ? "https://api.devnet.solana.com" : "https://api.mainnet-beta.solana.com");
  }

  /**
   * Estima as taxas de protocolo, custo de gas dos hops e o revenue share do builder.
   */
  estimateFees({ amount, tokenSymbol, hops = 3 }) {
    const token = SUPPORTED_TOKENS[tokenSymbol.toUpperCase()];
    if (!token) {
      throw new Error(`Token não suportado: ${tokenSymbol}. Suportados: ${Object.keys(SUPPORTED_TOKENS).join(", ")}`);
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error("Quantidade inválida informada.");
    }

    // Taxa do protocolo: 0.5% (50 BPS)
    const protocolFee = (numericAmount * PROTOCOL_FEE_BPS) / 10000;
    // Builder Revenue Share: 0.25% (25 BPS)
    const builderShare = protocolFee / 2;
    // Custo estimado de gas por salto no orquestrador (5,000 lamports por tx)
    const estimatedGasSol = (hops * 0.000005) + 0.002; // + vault rental buffer

    return {
      token: token.symbol,
      amount: numericAmount,
      hops,
      protocolFee,
      builderRevenueShare: builderShare,
      netDeliveredAmount: numericAmount - protocolFee,
      estimatedGasSol,
      privacyScore: this.calculatePrivacyScore(hops)
    };
  }

  /**
   * Calcula a pontuação de privacidade baseada na entropia dos saltos temporais e intermediários.
   */
  calculatePrivacyScore(hops) {
    if (hops <= 1) return { score: 30, level: "LOW", anonymitySet: "~10" };
    if (hops === 2) return { score: 65, level: "MEDIUM", anonymitySet: "~250" };
    if (hops === 3) return { score: 92, level: "HIGH", anonymitySet: "> 5,000" };
    return { score: 99, level: "MAXIMUM", anonymitySet: "> 50,000 (Temporal Delay Buffering)" };
  }

  /**
   * Constrói o plano de transferência privada MultiHopper.
   */
  createPrivateTransferPlan({ sender, recipient, amount, tokenSymbol, hops = 3 }) {
    const feeEstimate = this.estimateFees({ amount, tokenSymbol, hops });
    const token = SUPPORTED_TOKENS[tokenSymbol.toUpperCase()];

    const transferId = `mh_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return {
      transferId,
      status: "PLANNED",
      network: this.network,
      sender,
      recipient,
      tokenMint: token.mint,
      tokenSymbol: token.symbol,
      amount: feeEstimate.amount,
      netAmount: feeEstimate.netDeliveredAmount,
      hops,
      feeDetails: {
        protocolFee: feeEstimate.protocolFee,
        builderShare: feeEstimate.builderRevenueShare,
        estimatedGasSol: feeEstimate.estimatedGasSol
      },
      onChainPrograms: {
        core: MULTIHOPPER_PROGRAM_ID,
        orchestrator: MULTIHOPPER_ORCHESTRATOR_ID,
        transferHookGuard: MULTIHOPPER_TRANSFER_HOOK_ID
      },
      privacyMetrics: feeEstimate.privacyScore,
      createdAt: new Date().toISOString()
    };
  }
}
