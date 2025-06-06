// Contract deployment information
export const CONTRACT_CONFIG = {
  PACKAGE_ID: "0xca48a311807c6d40f8aa069f11701a5ea4b6386fbd8ee5ab7491da3e1273b0a5",
  NETWORK: "testnet" as const,
} as const;

// Game constants
export const GAME_CONSTANTS = {
  MARK_EMPTY: 0,
  MARK_X: 1,
  MARK_O: 2,
} as const;

// UI constants
export const UI_CONFIG = {
  MAX_ADDRESS_LENGTH: 10,
  TRUNCATE_START: 6,
  TRUNCATE_END: 4,
} as const;