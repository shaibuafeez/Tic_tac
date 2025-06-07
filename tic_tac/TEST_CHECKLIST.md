# TicTac Game Test Checklist

## 1. Smart Contract Functionality Tests

### Game Creation Tests
- [ ] Create friendly game successfully
- [ ] Create competitive game with valid stake amount
- [ ] Create competitive game with insufficient balance (should fail)
- [ ] Verify game state initialization (board, turn, players, status)
- [ ] Verify game links generation
- [ ] Verify event emission on game creation
- [ ] Test multiple concurrent game creations by same player

### Game Joining Tests
- [ ] Join friendly game as second player
- [ ] Join competitive game with matching stake
- [ ] Join competitive game with insufficient stake (should fail)
- [ ] Attempt to join own game (should fail)
- [ ] Attempt to join already active game (should fail)
- [ ] Attempt to join cancelled game (should fail)
- [ ] Verify game status changes from WAITING to ACTIVE
- [ ] Verify timeout tracking starts after joining

### Game Play Tests
- [ ] Make valid move on empty cell
- [ ] Make move on occupied cell (should fail)
- [ ] Make move when not player's turn (should fail)
- [ ] Make move in completed game (should fail)
- [ ] Verify board state updates correctly
- [ ] Verify turn counter increments
- [ ] Verify last_move_epoch updates
- [ ] Test all winning combinations (rows, columns, diagonals)
- [ ] Test draw scenario (full board, no winner)
- [ ] Verify winner determination logic

### Prize Distribution Tests
- [ ] Calculate platform fee correctly (10%)
- [ ] Distribute prizes to winner in competitive game
- [ ] Return stakes to both players in draw
- [ ] Verify treasury balance increases by platform fee
- [ ] Verify total_fees_collected tracking
- [ ] Test prize distribution with various stake amounts
- [ ] Verify NFT trophy creation for winner

### Timeout Mechanism Tests
- [ ] Claim timeout victory after 1 hour of inactivity
- [ ] Attempt to claim timeout before 1 hour (should fail)
- [ ] Claim timeout by correct player (waiting player)
- [ ] Attempt to claim timeout by current turn player (should fail)
- [ ] Verify timeout victory prize distribution
- [ ] Test timeout claim in friendly vs competitive games

### Treasury Management Tests
- [ ] Withdraw fees with admin capability
- [ ] Attempt to withdraw without admin capability (should fail)
- [ ] Withdraw partial treasury balance
- [ ] Attempt to withdraw more than treasury balance (should fail)
- [ ] Verify treasury balance updates after withdrawal

### Game Cancellation Tests
- [ ] Cancel game in WAITING status
- [ ] Cancel game with timeout mechanism
- [ ] Return stake to creator on cancellation
- [ ] Attempt to cancel ACTIVE game (should fail)
- [ ] Attempt to cancel COMPLETED game (should fail)
- [ ] Verify game status changes to CANCELLED

## 2. Frontend UI/UX Tests

### Wallet Connection Tests
- [ ] Connect wallet successfully
- [ ] Display correct wallet address
- [ ] Handle wallet disconnection
- [ ] Show appropriate UI for non-connected state
- [ ] Test with different wallet providers

### Game Creation Flow Tests
- [ ] Select friendly game mode
- [ ] Select competitive game mode
- [ ] Input valid stake amount
- [ ] Input invalid stake amount (negative, zero, too high)
- [ ] Display loading state during creation
- [ ] Show share modal after creation
- [ ] Copy game link functionality
- [ ] Copy viewer link functionality

### Game Joining Flow Tests
- [ ] Load game from shared link
- [ ] Display game details (creator, stake, mode)
- [ ] Show join button for valid games
- [ ] Show appropriate message for own games
- [ ] Handle insufficient balance gracefully
- [ ] Display loading state during joining

### Game Board Interaction Tests
- [ ] Click on empty cells to make moves
- [ ] Prevent clicks on occupied cells
- [ ] Disable board when not player's turn
- [ ] Show current player indicator
- [ ] Highlight winning combination
- [ ] Display game over state
- [ ] Show draw state appropriately

### Real-time Synchronization Tests
- [ ] Update board when opponent makes move
- [ ] Update game status in real-time
- [ ] Handle connection issues gracefully
- [ ] Test sync interval (3 seconds)
- [ ] Sync stops when game completes

### Multi-language Support Tests
- [ ] Switch between supported languages
- [ ] Verify all UI text translations
- [ ] Test RTL language support if applicable
- [ ] Persist language preference

### Responsive Design Tests
- [ ] Test on mobile devices (various sizes)
- [ ] Test on tablets
- [ ] Test on desktop browsers
- [ ] Verify touch interactions on mobile
- [ ] Test landscape/portrait orientations

## 3. Integration Tests

### Blockchain Integration Tests
- [ ] Transaction signing and execution
- [ ] Gas estimation accuracy
- [ ] Handle transaction failures gracefully
- [ ] Verify transaction confirmations
- [ ] Test network switching (if applicable)

### Game State Synchronization Tests
- [ ] Local state matches blockchain state
- [ ] Handle state conflicts appropriately
- [ ] Test state recovery after errors
- [ ] Verify optimistic updates rollback on failure

### Event Handling Tests
- [ ] Listen and react to GameCreated events
- [ ] Listen and react to GameJoined events
- [ ] Listen and react to MoveMade events
- [ ] Listen and react to GameCompleted events
- [ ] Listen and react to TimeoutVictory events

### API and RPC Tests
- [ ] Test Sui RPC endpoint reliability
- [ ] Handle RPC errors gracefully
- [ ] Test with different RPC providers
- [ ] Verify retry logic for failed requests

## 4. Edge Cases to Verify

### Concurrency Edge Cases
- [ ] Two players joining same game simultaneously
- [ ] Making moves at exact same time
- [ ] Multiple timeout claims simultaneously
- [ ] Creating games while others are pending

### Network Edge Cases
- [ ] Play with poor network connection
- [ ] Handle network disconnection mid-game
- [ ] Test with high latency
- [ ] Verify offline state handling

### Financial Edge Cases
- [ ] Stake amount edge values (min/max)
- [ ] Gas estimation edge cases
- [ ] Handle gas price spikes
- [ ] Test with exactly matching balance

### Timing Edge Cases
- [ ] Timeout claim at exact 1-hour mark
- [ ] Multiple moves in rapid succession
- [ ] Game state during epoch transitions
- [ ] Clock synchronization issues

### User Behavior Edge Cases
- [ ] Rapid clicking on cells
- [ ] Multiple browser tabs with same game
- [ ] Browser refresh during game
- [ ] Navigation during transactions

## 5. Security Considerations

### Smart Contract Security
- [ ] Reentrancy protection verification
- [ ] Integer overflow/underflow checks
- [ ] Access control validation
- [ ] State manipulation prevention
- [ ] Gas limit attack prevention

### Frontend Security
- [ ] XSS prevention in game links
- [ ] CSRF protection
- [ ] Secure wallet connection handling
- [ ] Private key exposure prevention
- [ ] Phishing attack prevention

### Game Logic Security
- [ ] Turn validation enforcement
- [ ] Win condition manipulation prevention
- [ ] Timeout exploitation prevention
- [ ] Prize calculation accuracy
- [ ] Treasury fund protection

### Data Validation
- [ ] Input sanitization (stake amounts)
- [ ] Game ID validation
- [ ] Address format validation
- [ ] Move coordinate validation
- [ ] Transaction parameter validation

### Economic Security
- [ ] Platform fee bypass prevention
- [ ] Double-spending prevention
- [ ] Stake manipulation prevention
- [ ] Treasury drain prevention
- [ ] Fair prize distribution verification

## Additional Testing Considerations

### Performance Tests
- [ ] Load testing with many concurrent games
- [ ] UI responsiveness under load
- [ ] Transaction throughput limits
- [ ] State synchronization efficiency

### Compatibility Tests
- [ ] Browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Wallet compatibility (Sui Wallet, Ethos, Martian)
- [ ] Mobile wallet integration
- [ ] Different screen resolutions

### User Experience Tests
- [ ] Onboarding flow for new users
- [ ] Error message clarity
- [ ] Loading state feedback
- [ ] Success/failure notifications
- [ ] Help and documentation availability

### Monitoring and Analytics
- [ ] Error logging and reporting
- [ ] User action tracking
- [ ] Performance metrics collection
- [ ] Treasury balance monitoring
- [ ] Game completion rates tracking

## Test Execution Notes

1. **Priority Order**: Start with smart contract tests, then integration tests, followed by UI tests
2. **Test Environment**: Use Sui testnet for contract testing, local environment for UI testing
3. **Test Data**: Create dedicated test wallets with sufficient SUI balance
4. **Automation**: Consider automating critical path tests
5. **Documentation**: Document all test results and discovered issues

## Acceptance Criteria

- All critical path tests must pass
- No security vulnerabilities identified
- Performance meets expected benchmarks
- UI/UX is intuitive and responsive
- Error handling is comprehensive
- Multi-language support is complete