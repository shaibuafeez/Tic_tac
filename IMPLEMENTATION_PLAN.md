# Tic-Tac-Toe Enhancement Implementation Plan

## Priority 1: Critical Issues (Implement First)

### 1. Timeout Victory Mechanism
**Problem**: Players can abandon games, locking opponent's SUI forever
**Solution**:
- Add `last_move_epoch` to Game struct
- Add `claim_timeout_victory()` function
- UI shows countdown timer when it's opponent's turn
- After 1 hour of no move, allow claim victory

**Smart Contract Changes**:
```move
// Add to Game struct
last_move_epoch: u64,

// New function
public fun claim_timeout_victory(game: &mut Game, ctx: &mut TxContext) {
    // Check 1 hour has passed
    // Award victory to waiting player
    // Distribute prizes
}
```

**Frontend Changes**:
- Add countdown timer component
- Add "Claim Victory" button after timeout
- Show time remaining in game status

### 2. Balance Pre-check
**Problem**: Users might not have enough SUI for stake + gas
**Solution**:
- Check balance before showing join button
- Estimate gas costs (~0.01 SUI)
- Clear error message if insufficient

**Implementation**:
```typescript
const canJoin = userBalance >= stakeAmount + GAS_BUFFER;
if (!canJoin) {
  showError(`Need ${formatSUI(stakeAmount + GAS_BUFFER)} SUI (stake + gas)`);
}
```

## Priority 2: High Value Features

### 3. Universal Leaderboard
**Smart Contract**:
```move
public struct Leaderboard has key {
    id: UID,
    top_players: vector<PlayerStats>,
}

public struct PlayerStats has store {
    player: address,
    total_profit: u64,
    total_loss: u64,
    games_won: u64,
}
```

**Frontend**:
- New `/leaderboard` page
- Show top 20 by profit
- Player stats: Win rate, total profit, games played

### 4. Rematch Feature
**Implementation**:
- After game ends, show "Rematch" button
- Creates new game with same settings
- Auto-invites previous opponent
- One-click to accept rematch

### 5. Admin Panel
**Features**:
- Check for AdminCap ownership
- Show treasury balance
- Withdraw fees button
- Platform statistics

**Route**: `/admin` (protected)

### 6. Share Win Achievement
**After winning**:
- Twitter share button
- Message includes:
  - Win amount
  - Game replay link
  - Stats (e.g., "3rd win today!")

## Implementation Order

### Phase 1 (Week 1)
1. **Timeout Victory** - Critical for user funds safety
2. **Balance Check** - Prevents failed transactions

### Phase 2 (Week 1-2)
3. **Leaderboard** - Adds competition element
4. **Share Achievements** - Viral growth

### Phase 3 (Week 2)
5. **Rematch** - Better UX
6. **Admin Panel** - Platform management

## Technical Considerations

### Smart Contract Updates
1. Need to deploy new version with timeout tracking
2. Migrate existing games or support both versions
3. Add leaderboard as shared object

### Frontend Updates
1. Add real-time countdown timers
2. Balance checking with wallet integration
3. New routes for leaderboard and admin

### Gas Optimization
- Batch leaderboard updates
- Efficient sorting algorithm
- Limit leaderboard size

## Testing Plan
1. Test timeout claims at exactly 1 hour
2. Test insufficient balance scenarios
3. Load test leaderboard with many players
4. Test admin functions with/without capability

## Migration Strategy
1. Deploy enhanced contract
2. Update frontend to use new contract
3. Keep old contract for existing games
4. Gradually phase out old version

## Success Metrics
- No more stuck games after 1 week
- 50%+ games have rematches
- Top 20 leaderboard fully populated
- Zero failed joins due to balance issues