// Contract deployment information
export const CONTRACT_CONFIG = {
  PACKAGE_ID: "0xb1bd6ea90c262ae8bbedc5a4ef609381b621b63eeec7e5c95fbdb5062dcfbd41",
  TREASURY_ID: "0x7deeac78dbfd70438e9a2f9fb76d0db6fd095c52658762dda2f5a6e366e65810",
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