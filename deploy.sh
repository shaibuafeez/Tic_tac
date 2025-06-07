#!/bin/bash

# Tic-Tac-Toe Enhanced Deployment Script

echo "🚀 Deploying Tic-Tac-Toe Enhanced to Sui Testnet..."

# Change to the Move package directory
cd tic_tac

# Build the package
echo "📦 Building Move package..."
sui move build

# Deploy to testnet
echo "🌐 Publishing to Sui testnet..."
DEPLOY_OUTPUT=$(sui client publish --gas-budget 100000000 2>&1)

# Extract important addresses from deployment output
echo "$DEPLOY_OUTPUT" > deployment_output.txt

# Parse the output to get contract addresses
PACKAGE_ID=$(echo "$DEPLOY_OUTPUT" | grep -A1 "Published Objects" | grep "PackageID" | awk -F': ' '{print $2}' | tr -d ' ')
TREASURY_ID=$(echo "$DEPLOY_OUTPUT" | grep "Treasury" -A1 | grep "ObjectID" | awk -F': ' '{print $2}' | tr -d ' ')
LEADERBOARD_ID=$(echo "$DEPLOY_OUTPUT" | grep "Leaderboard" -A1 | grep "ObjectID" | awk -F': ' '{print $2}' | tr -d ' ')
ADMIN_CAP_ID=$(echo "$DEPLOY_OUTPUT" | grep "AdminCap" -A1 | grep "ObjectID" | awk -F': ' '{print $2}' | tr -d ' ')

# Create deployment info file
cat > ../deployment_info.md << EOF
# Deployment Information

## Contract Addresses

- **Package ID**: $PACKAGE_ID
- **Treasury ID**: $TREASURY_ID
- **Leaderboard ID**: $LEADERBOARD_ID
- **Admin Cap ID**: $ADMIN_CAP_ID

## Deployment Date
$(date)

## Network
Sui Testnet

## Next Steps
1. Update \`src/config/constants.ts\` with these addresses
2. Test all features
3. Monitor for any issues
EOF

echo "✅ Deployment complete!"
echo ""
echo "📋 Contract addresses saved to deployment_info.md"
echo ""
echo "Package ID: $PACKAGE_ID"
echo "Treasury ID: $TREASURY_ID"
echo "Leaderboard ID: $LEADERBOARD_ID"
echo "Admin Cap ID: $ADMIN_CAP_ID"