export const MULTIHOPPER_PROGRAM_ID = "3jLoS2wbNgtKzieUUxwg6Xhdv6gbZkHDtPWA9ZAgspFh";
export const MULTIHOPPER_ORCHESTRATOR_ID = "4TPCmR2uN3hDM1FbTsf7ZtFXwXGSz4u1Kxv5YHj6eruX";
export const MULTIHOPPER_TRANSFER_HOOK_ID = "2JEv3pD6nczEvn1xDXaEzehkJofPPjoQQpnW5nGY3r52";

export const API_BASE_URL_MAINNET = "https://business.multihopper.com/api/v1";
export const API_BASE_URL_DEVNET = "https://devnet-business.multihopper.com/api/v1";

export const SUPPORTED_TOKENS = {
  USDC: {
    symbol: "USDC",
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    decimals: 6,
    defaultHops: 3
  },
  SOL: {
    symbol: "SOL",
    mint: "So11111111111111111111111111111111111111112",
    decimals: 9,
    defaultHops: 3
  },
  USDT: {
    symbol: "USDT",
    mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    decimals: 6,
    defaultHops: 3
  }
};

export const PROTOCOL_FEE_BPS = 50; // 0.5% (25 bps protocol + 25 bps builder revenue share)
