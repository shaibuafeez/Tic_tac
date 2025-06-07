# Tic-Tac-Toe Smart Contract Deployment Guide

## Prerequisites

1. **Sui CLI installed**
   ```bash
   # Check if Sui is installed
   sui --version
   ```

2. **Sufficient SUI balance on testnet**
   ```bash
   # Check your active address
   sui client active-address
   
   # Check your balance
   sui client balance
   ```

3. **Active Sui testnet configuration**
   ```bash
   # Switch to testnet if needed
   sui client switch --env testnet
   ```

## Pre-Deployment Checklist

- [x] All tests passing (12/12 tests passed)
- [x] Treasury fee collection implemented (10% platform fee)
- [x] Timeout victory mechanism implemented (1 hour timeout)
- [x] Smart contract security verified
- [ ] Testnet SUI balance sufficient for deployment

## Deployment Steps

### 1. Build the Contract

```bash
cd /Users/cyber/tic\ tac/Game/tic_tac
sui move build
```

Expected output:
```
BUILDING tic_tac
Successfully verified dependencies on-chain against source.
Build Successful
```

### 2. Deploy to Testnet

```bash
sui client publish --gas-budget 100000000
```

This command will:
- Deploy the smart contract to Sui testnet
- Create the Treasury shared object
- Transfer AdminCap to your address

### 3. Record Important Addresses

After deployment, you'll receive output containing:

```
╭──────────────────────────────────────────────────────────────────────────────────────╮
│ Object Changes                                                                       │
├──────────────────────────────────────────────────────────────────────────────────────┤
│ Created Objects:                                                                     │
│  ┌──                                                                                │
│  │ ObjectID: 0x... (PACKAGE_ID - Save this!)                                       │
│  │ ObjectType: 0x2::package::UpgradeCap                                           │
│  └──                                                                                │
│  ┌──                                                                                │
│  │ ObjectID: 0x... (TREASURY_ID - Save this!)                                      │
│  │ ObjectType: 0x<PACKAGE_ID>::tic_tac::Treasury                                  │
│  └──                                                                                │
│  ┌──                                                                                │
│  │ ObjectID: 0x... (ADMIN_CAP_ID - Save this!)                                     │
│  │ ObjectType: 0x<PACKAGE_ID>::tic_tac::AdminCap                                  │
│  └──                                                                                │
╰──────────────────────────────────────────────────────────────────────────────────────╯
```

**IMPORTANT: Save these values:**
- `PACKAGE_ID`: The deployed package address
- `TREASURY_ID`: The shared Treasury object ID
- `ADMIN_CAP_ID`: Your admin capability (keep this secure!)

### 4. Update Frontend Configuration

Update `/Users/cyber/tic tac/Game/tic-tac-frontend/src/config/constants.ts`:

```typescript
export const CONTRACT_CONFIG = {
  PACKAGE_ID: "0x...", // Your deployed package ID
  TREASURY_ID: "0x...", // Your treasury ID
  ADMIN_CAP_ID: "0x...", // Your admin cap ID
  NETWORK: "testnet" as const,
} as const;
```

### 5. Verify Deployment

```bash
# Check Treasury object
sui client object <TREASURY_ID>

# Check your AdminCap
sui client object <ADMIN_CAP_ID>
```

## Post-Deployment Steps

### 1. Test Game Creation

```bash
# Create a friendly game
sui client call \
  --package <PACKAGE_ID> \
  --module tic_tac \
  --function create_friendly_game \
  --gas-budget 10000000
```

### 2. Monitor Treasury

```bash
# Check treasury balance
sui client call \
  --package <PACKAGE_ID> \
  --module tic_tac \
  --function get_treasury_balance \
  --args <TREASURY_ID> \
  --gas-budget 10000000
```

### 3. Frontend Testing

1. Update the frontend config with deployment addresses
2. Build and run the frontend:
   ```bash
   cd /Users/cyber/tic\ tac/Game/tic-tac-frontend
   npm run build
   npm run start
   ```
3. Test all game flows:
   - Create friendly game
   - Create competitive game
   - Join games
   - Play games
   - Win conditions
   - Timeout victories

## Security Considerations

1. **AdminCap Security**
   - Store AdminCap ID securely
   - Never share AdminCap ID publicly
   - Consider using a multisig wallet for production

2. **Treasury Management**
   - Monitor treasury balance regularly
   - Set up alerts for large deposits
   - Plan withdrawal schedule

3. **Smart Contract Upgrades**
   - Keep UpgradeCap secure
   - Test all upgrades on testnet first
   - Have rollback plan ready

## Monitoring & Maintenance

### Daily Tasks
- Check treasury balance
- Monitor active games
- Review transaction logs

### Weekly Tasks
- Withdraw accumulated fees
- Review game statistics
- Check for stuck games

### Monthly Tasks
- Analyze platform metrics
- Review security logs
- Plan feature updates

## Troubleshooting

### Common Issues

1. **Deployment fails with "insufficient gas"**
   ```bash
   # Increase gas budget
   sui client publish --gas-budget 200000000
   ```

2. **Transaction simulation failed**
   - Check you have sufficient SUI balance
   - Verify network connection
   - Ensure correct network (testnet)

3. **Object not found errors**
   - Verify object IDs are correct
   - Check object hasn't been deleted
   - Ensure on correct network

## Support Resources

- Sui Documentation: https://docs.sui.io/
- Sui Discord: https://discord.gg/sui
- GitHub Issues: https://github.com/MystenLabs/sui/issues

## Next Steps

1. **Deploy to Mainnet** (when ready)
   - Audit smart contract
   - Test extensively on testnet
   - Prepare mainnet deployment plan

2. **Set up Monitoring**
   - Configure analytics
   - Set up error tracking
   - Create admin dashboard

3. **Launch Marketing**
   - Announce deployment
   - Create tutorial videos
   - Engage community

---

## Deployment Checklist Summary

- [ ] Build contract successfully
- [ ] Deploy to testnet
- [ ] Record all object IDs
- [ ] Update frontend configuration
- [ ] Test all game flows
- [ ] Verify treasury collection
- [ ] Test timeout victories
- [ ] Document admin procedures
- [ ] Set up monitoring
- [ ] Plan mainnet deployment

---

**Note**: This deployment is for TESTNET. For mainnet deployment, additional security audits and testing are required.