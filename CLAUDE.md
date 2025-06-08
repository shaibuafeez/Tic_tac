# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TicTac is a blockchain-based Tic-Tac-Toe game built on the Sui network with:
- Smart contracts in Move language
- Next.js frontend with TypeScript
- Two game modes: Friendly (free) and Competitive (with SUI stakes)
- Global leaderboard and timeout victory mechanism
- 15-minute timeout per move (globally synchronized)
- Rematch functionality with position swapping

## Common Development Commands

### Frontend Development
```bash
cd tic-tac-frontend
npm install           # Install dependencies
npm run dev          # Start development server at localhost:3000
npm run build        # Create production build
npm run lint         # Run ESLint
```

### Smart Contract Development
```bash
cd tic_tac
sui move build       # Compile Move contracts
sui move test        # Run contract tests
sui client publish   # Deploy to Sui network
```

### Deployment
```bash
./deploy.sh          # Automated deployment script
```

## Architecture Overview

### Smart Contract Structure
- **tic_tac_enhanced.move**: Main game logic with timeout mechanism, treasury management, and NFT rewards
- **leaderboard.move**: Player statistics and ranking system
- **Treasury**: Shared object collecting 10% platform fees from competitive games
- **Leaderboard**: Shared object tracking top 20 players by net profit

### Frontend Architecture
- **Game Flow**: Home → Create/Join Game → Play → View Results
- **State Management**: React Context for language, Tanstack Query for blockchain data
- **Real-time Updates**: Polling mechanism for game state synchronization
- **Wallet Integration**: Mysten dApp Kit with balance pre-checks

### Key Configuration Files
- `tic-tac-frontend/src/config/constants.ts`: Contract addresses and game parameters
- `tic_tac/Move.toml`: Sui package dependencies and addresses

## Important Implementation Details

### Timeout Victory System
- 15-minute timeout per move (900,000 milliseconds)
- Timer is globally synchronized using Sui Clock
- Smart contract stores `last_move_ms` in milliseconds
- Frontend converts milliseconds to seconds for display
- Both players see the same countdown timer
- Non-active player can claim victory after timeout expires

### Multi-language Support
- Languages: English, Spanish, Chinese
- Implemented via LanguageContext provider
- Translations in `src/i18n/translations.ts`

### Admin Features
- Admin panel at `/admin` for treasury management
- Capability-based access control in smart contract
- Admin can withdraw accumulated platform fees

### Testing Approach
- Frontend: Component testing with React Testing Library
- Smart Contracts: Move unit tests in `tests/tic_tac_tests.move`
- Always verify balance checks and timeout logic when making changes

## Contract Addresses
When deploying to a new network, update these addresses in `constants.ts`:
- PACKAGE_ID
- TREASURY_ID
- LEADERBOARD_ID
- ADMIN_CAP (if applicable)

## Current Status
- Core game functionality: Complete
- Timeout mechanism: Updated to 15 minutes
- Leaderboard: Expanded to top 100 with pagination
- Admin panel: Operational
- Rematch feature: Implemented with position swapping
- Pending: Social sharing of wins

## Recent Updates (Dec 2024)
- Reduced timeout from 1 hour to 15 minutes
- Fixed timer synchronization bugs (millisecond/second conversions)
- Implemented rematch functionality
- Expanded leaderboard capacity to 100 players