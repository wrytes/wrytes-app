import { useCallback, useMemo } from 'react';
import { useChainId } from 'wagmi';
import { UseTokenBalancesProps, UseTokenBalancesReturn, TokenBalanceInfo } from './types';
import { useBalance } from '@/hooks/web3/useBalance';
import { useAuthorizationBalance } from './useAuthorizationBalance';
import { useCowTokenList } from '@/hooks/tokens';

/**
 * useTokenBalances - Fetch wallet and processor balances for multiple tokens
 * Combines wallet balances and authorization processor balances
 */
export const useTokenBalances = ({
  address,
  processorAddress = '0x3874161854D0D5f13B4De2cB5061d9cff547466E', // Default from useAuthorizationForm
  watch = false,
  refetchInterval = 30000,
  enabled = true,
}: UseTokenBalancesProps): UseTokenBalancesReturn => {
  const chainId = useChainId();

  // Get all configured tokens from CoW token list + custom tokens
  const { tokens } = useCowTokenList(chainId);

  // Create individual balance hooks for each token (wallet balances)
  const walletBalanceHooks = tokens.map(token =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useBalance({
      address,
      token: token.address,
      chainId,
      watch,
      refetchInterval,
      enabled: enabled && !!address,
    })
  );

  // Create individual processor balance hooks for each token
  const processorBalanceHooks = tokens.map(token =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAuthorizationBalance({
      processorAddress,
      owner: address,
      token: token.address,
      chainId,
      watch,
      refetchInterval,
      enabled: enabled && !!address && !!processorAddress,
    })
  );

  // Combine hook data into stable objects for useMemo dependencies
  const walletData = useMemo(() => 
    walletBalanceHooks.map(h => `${h.balance}-${h.loading}-${h.error?.message || ''}`).join('|'),
    walletBalanceHooks.map(h => [h.balance, h.loading, h.error?.message]).flat()
  );
  
  const processorData = useMemo(() => 
    processorBalanceHooks.map(h => `${h.balance}-${h.loading}-${h.error?.message || ''}`).join('|'),
    processorBalanceHooks.map(h => [h.balance, h.loading, h.error?.message]).flat()
  );

  // Compute balances using useMemo with stable dependencies
  const balances = useMemo((): TokenBalanceInfo[] => {
    return tokens.map((token, index) => {
      const walletHook = walletBalanceHooks[index];
      const processorHook = processorBalanceHooks[index];

      return {
        token,
        walletBalance: walletHook.balance,
        processorBalance: processorHook.balance,
        isLoading: walletHook.loading || processorHook.loading,
        error: walletHook.error || processorHook.error,
      };
    });
  }, [tokens, walletData, processorData]);

  // Compute global loading and error states
  const loading = useMemo(() => {
    return balances.some(balance => balance.isLoading);
  }, [balances]);

  const error = useMemo(() => {
    return balances.find(balance => balance.error)?.error || null;
  }, [balances]);

  // Refetch all balances
  const refetch = useCallback(async () => {
    try {
      // Refetch all wallet balances
      await Promise.all(walletBalanceHooks.map(hook => hook.refetch()));
      // Refetch all processor balances
      await Promise.all(processorBalanceHooks.map(hook => hook.refetch()));
    } catch (err) {
      console.error('Failed to refetch balances:', err);
      // Individual hook errors will be captured in the error state
    }
  }, [walletBalanceHooks, processorBalanceHooks]);

  // Filter balances based on whether to show zero balances
  const getFilteredBalances = useCallback(
    (showZeroBalances: boolean = false) => {
      if (showZeroBalances) {
        return balances;
      }
      return balances.filter(
        balance => balance.walletBalance > 0n || balance.processorBalance > 0n
      );
    },
    [balances]
  );

  return {
    balances,
    filteredBalances: getFilteredBalances(false),
    loading,
    error,
    refetch,
    getFilteredBalances,
  };
};
