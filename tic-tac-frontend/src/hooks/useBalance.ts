import { useCurrentAccount, useSuiClientQuery } from '@mysten/dapp-kit';

const MIN_GAS_BUFFER = 10_000_000; // 0.01 SUI for gas

export function useBalance() {
  const account = useCurrentAccount();
  
  const { data: balance, isLoading, error } = useSuiClientQuery('getBalance', {
    owner: account?.address || '',
    coinType: '0x2::sui::SUI',
  }, {
    enabled: !!account,
  });

  const totalBalance = balance ? BigInt(balance.totalBalance) : BigInt(0);
  
  const checkSufficientBalance = (requiredAmount: number): boolean => {
    return totalBalance >= BigInt(requiredAmount + MIN_GAS_BUFFER);
  };

  const getAvailableBalance = (): bigint => {
    const available = totalBalance - BigInt(MIN_GAS_BUFFER);
    return available > 0 ? available : BigInt(0);
  };

  return {
    balance: totalBalance,
    balanceInSUI: Number(totalBalance) / 1_000_000_000,
    isLoading,
    error,
    checkSufficientBalance,
    getAvailableBalance,
    minGasBuffer: MIN_GAS_BUFFER,
  };
}