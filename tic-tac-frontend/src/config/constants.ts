// Contract deployment information
export const CONTRACT_CONFIG = {
  PACKAGE_ID: "0xb6ee34b9554a69c317a60104593534573b85469881219f5077c0a23c30db76f9",
  TREASURY_ID: "0x554f6100d77b7fde9b42dd475895805fd45da16141367ba41fd4cb88d540b9c7",
  NETWORK: "testnet" as const,
} as const;

// Game constants
export const GAME_CONSTANTS = {
  MARK_EMPTY: 0,
  MARK_X: 1,
  MARK_O: 2,
} as const;

// Game modes
export const GAME_MODE = {
  FRIENDLY: 0,
  COMPETITIVE: 1,
} as const;

// Game status
export const GAME_STATUS = {
  WAITING: 0,
  ACTIVE: 1,
  COMPLETED: 2,
  CANCELLED: 3,
} as const;

// Platform fee (10%)
export const PLATFORM_FEE_BPS = 1000;
export const BPS_BASE = 10000;

// UI constants
export const UI_CONFIG = {
  MAX_ADDRESS_LENGTH: 10,
  TRUNCATE_START: 6,
  TRUNCATE_END: 4,
} as const;