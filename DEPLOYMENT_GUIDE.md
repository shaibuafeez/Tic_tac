# 🚀 Tic-Tac-Toe Enhanced - Deployment Guide

## Prerequisites

- Sui CLI installed and configured
- Sui wallet with testnet SUI for gas fees
- Node.js and npm installed for frontend

## Step 1: Deploy Enhanced Smart Contracts

### Run the deployment script:
```bash
./deploy.sh
```

### Or deploy manually:
```bash
cd tic_tac
sui move build
sui client publish --gas-budget 100000000
```

### Save the contract addresses from the output:
- Package ID
- Treasury ID
- Leaderboard ID
- Admin Cap ID

## Step 2: Update Frontend Constants

Update `src/config/constants.ts` with the new contract addresses:

```typescript
export const CONTRACT_CONFIG = {
  PACKAGE_ID: "0x...", // Your new package ID
  TREASURY_ID: "0x...", // Your treasury ID
  LEADERBOARD_ID: "0x...", // Your leaderboard ID
  ADMIN_CAP_ID: "0x...", // Your admin cap ID
  NETWORK: "testnet" as const,
} as const;
```

## Step 3: Test the Deployment

### Run the Move tests:
```bash
cd tic_tac
sui move test
```

### Start the frontend:
```bash
cd tic-tac-frontend
npm install
npm run dev
```

### Test features:
1. **Language Switching**: Check the language selector in the header
2. **Leaderboard**: Visit `/leaderboard` (empty initially)
3. **Admin Panel**: Visit `/admin` (only works if you have AdminCap)
4. **Game Creation**: Create both friendly and competitive games
5. **Balance Check**: Try joining with insufficient balance
6. **Timeout Victory**: Wait for timeout option to appear
7. **Notifications**: Check for pending game notifications

## Step 4: Verify All Features

### ✅ Checklist:

#### Core Features:
- [ ] Create friendly games
- [ ] Create competitive games with SUI stakes
- [ ] Join games
- [ ] Play complete games
- [ ] Win/lose/draw outcomes

#### Enhanced Features:
- [ ] **Timeout Victory**: After 1 hour of inactivity
- [ ] **Balance Check**: Prevents failed transactions
- [ ] **Leaderboard**: Shows top players by net profit
- [ ] **Rematch**: Quick rematch button after games
- [ ] **Admin Panel**: Treasury management (AdminCap required)
- [ ] **Share Wins**: Twitter sharing functionality
- [ ] **Notifications**: Badge shows pending moves count
- [ ] **Multi-Language**: English, Spanish, Chinese support

#### UI/UX:
- [ ] Language selector in header
- [ ] Notification badge in navigation
- [ ] Leaderboard link in navigation
- [ ] Admin panel accessible (if AdminCap owner)
- [ ] Responsive design
- [ ] Game animations and effects

## Step 5: Monitor and Maintain

### Check logs for:
- Failed transactions
- Contract interaction errors
- Frontend console errors

### Monitor:
- Treasury balance growth
- Game creation/completion rates
- User engagement metrics

## Troubleshooting

### Common Issues:

1. **"Insufficient gas" errors**
   - Increase gas budget in transactions
   - Ensure MIN_GAS_BUFFER is adequate

2. **"Object not found" errors**
   - Verify contract addresses in constants.ts
   - Check if objects exist on-chain

3. **Language selector not working**
   - Ensure LanguageProvider wraps the app in layout.tsx
   - Check localStorage permissions

4. **Leaderboard empty**
   - Leaderboard populates after competitive games
   - Check LEADERBOARD_ID in constants

5. **Admin panel access denied**
   - Only AdminCap owner can access
   - Check if you received AdminCap during deployment

## Production Deployment

### For mainnet deployment:

1. **Change network in constants.ts**:
   ```typescript
   NETWORK: "mainnet" as const,
   ```

2. **Deploy to mainnet**:
   ```bash
   sui client publish --gas-budget 100000000
   ```

3. **Update all contract addresses**

4. **Test thoroughly on mainnet**

## Support

If you encounter issues:
1. Check the deployment logs
2. Verify all contract addresses
3. Test each feature individually
4. Check browser console for errors

The implementation includes comprehensive error handling and user feedback to help identify issues quickly.

## Next Steps

After successful deployment:
1. Share the game with friends
2. Monitor treasury growth
3. Consider adding more languages
4. Implement additional game modes
5. Add more social features

🎉 **Your enhanced Tic-Tac-Toe game is ready!**