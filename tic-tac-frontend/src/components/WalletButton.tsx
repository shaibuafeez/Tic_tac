'use client';

import { ConnectButton } from '@mysten/dapp-kit';
import { Wallet, LogOut } from 'lucide-react';

export function WalletButton() {
  return (
    <ConnectButton 
      connectText={
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5" />
          <span>Connect Wallet</span>
        </div>
      }
      connectedText="Connected"
      className="wallet-connect-button modern-button"
    />
  );
}