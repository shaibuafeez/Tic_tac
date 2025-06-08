// Contract deployment information
export const CONTRACT_CONFIG = {
  PACKAGE_ID: "0xc9a3c98acd306b3928c61d78569d570d0c3828a940cd680da2e2b5a76a9b272c",
  TREASURY_ID: "0x517a8125913b2083b6dbb090e6c147585684a89c25794191dc46348cd7c27b59",
  LEADERBOARD_ID: "0x92eb706589517d3ce12199e48aeb440233a95776c71b0997009fad3ef2338fcb",
  ADMIN_CAP_ID: "0xa4076994c9c5f3613cafe7778d35a4095bc42845be21ea2ff28ae2ec51af9cd5",
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

// Timeout constants
export const MOVE_TIMEOUT_MS = 900000; // 15 minutes in milliseconds
export const MOVE_TIMEOUT_EPOCHS = 900; // 15 minutes in epochs (assuming 1 second per epoch)
export const MIN_GAS_BUFFER = 10_000_000; // 0.01 SUI buffer for gas fees

// Leaderboard constants
export const MAX_LEADERBOARD_SIZE = 100;

// UI constants
export const UI_CONFIG = {
  MAX_ADDRESS_LENGTH: 10,
  TRUNCATE_START: 6,
  TRUNCATE_END: 4,
} as const;