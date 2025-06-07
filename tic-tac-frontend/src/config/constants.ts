// Contract deployment information
export const CONTRACT_CONFIG = {
  PACKAGE_ID: "0x50800de50512fe8192113cd56882dc939b88f113609fbb45eaa8728e9eb91bcd",
  TREASURY_ID: "0xff42186ac2d520c576b5a00c2c06197bb6e8bed0f0dfd0b8e7ce257fb41b0db7",
  LEADERBOARD_ID: "0x60b2a7a2813906e6222033df62031dc2ddd9e35d12b8aef3aab2b0c4aabeafb2",
  ADMIN_CAP_ID: "0xb84fbc21b1b03cd3e5469a4994f7c457b3db9f79ea208f880a44c38d0fd137e7",
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
export const MOVE_TIMEOUT_EPOCHS = 3600; // 1 hour in epochs (assuming 1 second per epoch)
export const MIN_GAS_BUFFER = 10_000_000; // 0.01 SUI buffer for gas fees

// Leaderboard constants
export const MAX_LEADERBOARD_SIZE = 20;

// UI constants
export const UI_CONFIG = {
  MAX_ADDRESS_LENGTH: 10,
  TRUNCATE_START: 6,
  TRUNCATE_END: 4,
} as const;