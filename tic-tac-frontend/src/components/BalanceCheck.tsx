'use client';

import { Wallet, AlertCircle } from 'lucide-react';
import { useBalance } from '@/hooks/useBalance';

interface BalanceCheckProps {
  requiredAmount: number; // in MIST
  actionText?: string;
  onSufficientBalance?: () => void;
  onInsufficientBalance?: () => void;
}

export function BalanceCheck({ 
  requiredAmount, 
  actionText = "join this game",
  onSufficientBalance,
  onInsufficientBalance 
}: BalanceCheckProps) {
  const { balanceInSUI, checkSufficientBalance, minGasBuffer } = useBalance();
  
  const hasSufficientBalance = checkSufficientBalance(requiredAmount);
  const requiredSUI = (requiredAmount + minGasBuffer) / 1_000_000_000;
  const shortfall = requiredSUI - balanceInSUI;

  if (hasSufficientBalance) {
    if (onSufficientBalance) onSufficientBalance();
    return null;
  }

  if (onInsufficientBalance) onInsufficientBalance();

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-red-800 mb-1">
            Insufficient Balance
          </h4>
          <p className="text-sm text-red-700">
            You need <strong>{requiredSUI.toFixed(3)} SUI</strong> to {actionText} 
            (including {(minGasBuffer / 1_000_000_000).toFixed(3)} SUI for gas).
          </p>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <Wallet className="w-4 h-4 text-red-600" />
            <span className="text-red-700">
              Your balance: <strong>{balanceInSUI.toFixed(3)} SUI</strong>
            </span>
            <span className="text-red-600">
              (Need {shortfall.toFixed(3)} more SUI)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}