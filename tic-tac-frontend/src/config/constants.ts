// Contract deployment information
export const CONTRACT_CONFIG = {
  PACKAGE_ID: "0x32427a88755ea973174771427c01f6c98821c0e6f60534b097a5de9928b107bc",
  TREASURY_ID: "0xd92b80c36f1e949a27d6ead7044b93138c09d9e8ccd966c797de5b4be7933f8a",
  LEADERBOARD_ID: "0xc91bf80cd81d4b4ddf44fa8450d3cb07f68542f530b0edce75044c213ad354b2",
  ADMIN_CAP_ID: "0x04f2ff0c2887c17bb675fe26ee2f32097b8498fd23199c4cf7b2ccb18e3bf23b",
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

// SuiNS configuration
// NOTE: SuiNS may not be available on all networks. The app will gracefully fall back to addresses.
export const SUINS_CONFIG = {
  testnet: {
    REGISTRY: "0x9a2ed416c6068fafafa5ba02cef68ad10a1a4b8456e0c8a31c2be8ba66dc3b7e",
    PACKAGE: "0xb9291634325eb0970cf0cf5d24ea44f44f1ab6652b3a5d7be6341c231f3f4e1e",
    REGISTRY_API: "https://suins-registry-testnet.vercel.app/api"
  },
  mainnet: {
    REGISTRY: "0x6e0ddefc0ad98889c04bab9639e512c21766c5e6366f89e696956d9be6952871",
    PACKAGE: "0xd22b24490e0bae52676651b4f56660a5ff8022a2576e0089f79b3c88d44e08f0",
    REGISTRY_API: "https://suins-registry.vercel.app/api"
  },
  devnet: {
    REGISTRY: "0x9a2ed416c6068fafafa5ba02cef68ad10a1a4b8456e0c8a31c2be8ba66dc3b7e",
    PACKAGE: "0xb9291634325eb0970cf0cf5d24ea44f44f1ab6652b3a5d7be6341c231f3f4e1e",
    REGISTRY_API: "https://suins-registry-testnet.vercel.app/api"
  }
} as const;