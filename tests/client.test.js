import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { MultiHopperClient } from "../src/client.js";
import {
  MULTIHOPPER_PROGRAM_ID,
  MULTIHOPPER_ORCHESTRATOR_ID,
  MULTIHOPPER_TRANSFER_HOOK_ID,
  SUPPORTED_TOKENS,
  PROTOCOL_FEE_BPS
} from "../src/constants.js";

describe("MultiHopper Constants & Configuration", () => {
  test("canonical program IDs and protocol fee are correctly defined", () => {
    assert.equal(MULTIHOPPER_PROGRAM_ID, "3jLoS2wbNgtKzieUUxwg6Xhdv6gbZkHDtPWA9ZAgspFh");
    assert.equal(MULTIHOPPER_ORCHESTRATOR_ID, "4TPCmR2uN3hDM1FbTsf7ZtFXwXGSz4u1Kxv5YHj6eruX");
    assert.equal(MULTIHOPPER_TRANSFER_HOOK_ID, "2JEv3pD6nczEvn1xDXaEzehkJofPPjoQQpnW5nGY3r52");
    assert.equal(PROTOCOL_FEE_BPS, 50); // 0.5%
    assert.ok(SUPPORTED_TOKENS.USDC);
    assert.ok(SUPPORTED_TOKENS.SOL);
    assert.ok(SUPPORTED_TOKENS.USDT);
  });
});

describe("MultiHopperClient Fee Estimation", () => {
  const client = new MultiHopperClient();

  test("calculates accurate protocol fee (0.5%) and builder revenue share (0.25%) for USDC", () => {
    const est = client.estimateFees({ amount: 1000, tokenSymbol: "USDC", hops: 3 });

    assert.equal(est.token, "USDC");
    assert.equal(est.amount, 1000);
    assert.equal(est.hops, 3);
    assert.equal(est.protocolFee, 5); // 0.5% of 1000 = 5 USDC
    assert.equal(est.builderRevenueShare, 2.5); // 0.25% of 1000 = 2.5 USDC
    assert.equal(est.netDeliveredAmount, 995);
    assert.equal(est.privacyScore.level, "HIGH");
    assert.equal(est.privacyScore.score, 92);
  });

  test("calculates accurate fees for SOL transfers", () => {
    const est = client.estimateFees({ amount: 10, tokenSymbol: "SOL", hops: 4 });

    assert.equal(est.token, "SOL");
    assert.equal(est.amount, 10);
    assert.equal(est.protocolFee, 0.05); // 0.5% of 10 = 0.05 SOL
    assert.equal(est.builderRevenueShare, 0.025);
    assert.equal(est.netDeliveredAmount, 9.95);
    assert.equal(est.privacyScore.level, "MAXIMUM");
  });

  test("rejects unsupported tokens", () => {
    assert.throws(
      () => client.estimateFees({ amount: 100, tokenSymbol: "SHIB" }),
      /Token não suportado: SHIB/
    );
  });

  test("rejects invalid amounts", () => {
    assert.throws(
      () => client.estimateFees({ amount: -10, tokenSymbol: "USDC" }),
      /Quantidade inválida informada/
    );
    assert.throws(
      () => client.estimateFees({ amount: 0, tokenSymbol: "USDC" }),
      /Quantidade inválida informada/
    );
    assert.throws(
      () => client.estimateFees({ amount: "abc", tokenSymbol: "USDC" }),
      /Quantidade inválida informada/
    );
  });
});

describe("MultiHopperClient Privacy Scoring", () => {
  const client = new MultiHopperClient();

  test("evaluates privacy tiers based on hop count", () => {
    assert.deepEqual(client.calculatePrivacyScore(1), { score: 30, level: "LOW", anonymitySet: "~10" });
    assert.deepEqual(client.calculatePrivacyScore(2), { score: 65, level: "MEDIUM", anonymitySet: "~250" });
    assert.deepEqual(client.calculatePrivacyScore(3), { score: 92, level: "HIGH", anonymitySet: "> 5,000" });
    assert.deepEqual(client.calculatePrivacyScore(5), { score: 99, level: "MAXIMUM", anonymitySet: "> 50,000 (Temporal Delay Buffering)" });
  });
});

describe("MultiHopperClient Private Route Planning", () => {
  const client = new MultiHopperClient({ network: "mainnet-beta" });

  test("generates complete private routing plan with on-chain program references", () => {
    const plan = client.createPrivateTransferPlan({
      sender: "SolanaSenderPublicAddress1111111111111111",
      recipient: "SolanaRecipientPublicAddress2222222222222222",
      amount: 500,
      tokenSymbol: "USDC",
      hops: 3
    });

    assert.ok(plan.transferId.startsWith("mh_"));
    assert.equal(plan.status, "PLANNED");
    assert.equal(plan.network, "mainnet-beta");
    assert.equal(plan.sender, "SolanaSenderPublicAddress1111111111111111");
    assert.equal(plan.recipient, "SolanaRecipientPublicAddress2222222222222222");
    assert.equal(plan.tokenMint, SUPPORTED_TOKENS.USDC.mint);
    assert.equal(plan.amount, 500);
    assert.equal(plan.netAmount, 497.5);
    assert.equal(plan.hops, 3);
    assert.equal(plan.feeDetails.protocolFee, 2.5);
    assert.equal(plan.feeDetails.builderShare, 1.25);
    assert.equal(plan.onChainPrograms.core, MULTIHOPPER_PROGRAM_ID);
    assert.equal(plan.onChainPrograms.orchestrator, MULTIHOPPER_ORCHESTRATOR_ID);
    assert.equal(plan.onChainPrograms.transferHookGuard, MULTIHOPPER_TRANSFER_HOOK_ID);
    assert.equal(plan.privacyMetrics.level, "HIGH");
    assert.ok(plan.createdAt);
  });
});
