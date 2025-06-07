// Contract deployment information
export const CONTRACT_CONFIG = {
  PACKAGE_ID: "0x0b511957d417d40c09af03262245aaa732a1ca73391c317122fa8f90b8573184",
  TREASURY_ID: "0x450326e4ffe73f038609e49f592182a4a0a7161ef57535534eb10fbefdfdae8f",
  LEADERBOARD_ID: "0x0ab3a11c790c987227768b2fd044b97768d684e29e6b4ce819af56767dee0372",
  ADMIN_CAP_ID: "0xa7506f727ab767fcd5e1a9cb54fb95c16cbd70c22e33709a0bd5c628dba05cdf",
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