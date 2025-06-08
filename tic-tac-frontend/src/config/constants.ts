// Contract deployment information
export const CONTRACT_CONFIG = {
  PACKAGE_ID: "0xeb45d85cc35fdd9bce28e7f471dcc769c9c8d62949035de8ca51b5bc520b0757",
  TREASURY_ID: "0x32877a1117a498f98847e990f8ac7ac5ce156be7ac1627e54fdf6c21380519bf",
  LEADERBOARD_ID: "0x931cd4e53d26337e05388979d50ae8a0c8bd3d11edb6bf3f34255a0d6134f5db",
  ADMIN_CAP_ID: "0x4828accd1588721edd526d3b8b261f48e44add3e783dde904101602ffd1185a2",
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