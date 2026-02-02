import { useState, useEffect, useCallback, useMemo } from 'react';
import { useChainId } from 'wagmi';
import { readContract } from 'wagmi/actions';
import { UseTokenBalancesProps, UseTokenBalancesReturn, TokenBalanceInfo } from './types';
import { useCowTokenList } from '@/hooks/tokens';
import { WAGMI_CONFIG } from '@/lib/web3/config';
import { TokenConfig } from '@/lib/tokens/config';

const ERC20_BALANCE_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
] as const;

const PROCESSOR_BALANCE_ABI = [
  {
    name: 'balances',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'token', type: 'address' },
    ],
    outputs: [{ name: 'balance', type: 'uint256' }],
  },
] as const;

/**
 * Fetch wallet balance for a single token
 */
async function fetchWalletBalance(
  address: string,
  token: string,
  chainId: number
): Promise<bigint> {
  try {
    const balance = await readContract(WAGMI_CONFIG, {
      chainId,
      address: token as `0x${string}`,
      abi: ERC20_BALANCE_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    });
    return balance as bigint;
  } catch {
    return 0n;
  }
}

/**
 * Fetch processor balance for a single token
 */
async function fetchProcessorBalance(
  processorAddress: string,
  owner: string,
  token: string,
  chainId: number
): Promise<bigint> {
  try {
    const balance = await readContract(WAGMI_CONFIG, {
      chainId,
      address: processorAddress as `0x${string}`,
      abi: PROCESSOR_BALANCE_ABI,
      functionName: 'balances',
      args: [owner as `0x${string}`, token as `0x${string}`],
    });
    return balance as bigint;
  } catch {
    return 0n;
  }
}

/**
 * useTokenBalances - Fetch wallet and processor balances for multiple tokens
 * Combines wallet balances and authorization processor balances
 */
export const useTokenBalances = ({
  address,
  processorAddress = '0x3874161854D0D5f13B4De2cB5061d9cff547466E',
  watch = false,
  refetchInterval = 30000,
  enabled = true,
}: UseTokenBalancesProps): UseTokenBalancesReturn => {
  const chainId = useChainId();
  const { tokens, isLoading: tokensLoading } = useCowTokenList(chainId);

  const [balances, setBalances] = useState<TokenBalanceInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all balances
  const fetchAllBalances = useCallback(async () => {
    if (!enabled || !address || tokensLoading || tokens.length === 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await Promise.all(
        tokens.map(async (token: TokenConfig) => {
          const [walletBalance, processorBalance] = await Promise.all([
            fetchWalletBalance(address, token.address, chainId),
            processorAddress
              ? fetchProcessorBalance(processorAddress, address, token.address, chainId)
              : Promise.resolve(0n),
          ]);

          return {
            token,
            walletBalance,
            processorBalance,
            isLoading: false,
            error: null,
          };
        })
      );

      setBalances(results);
    } catch (err) {
      const fetchError = err instanceof Error ? err : new Error('Failed to fetch balances');
      setError(fetchError);
      console.error('Failed to fetch token balances:', err);
    } finally {
      setLoading(false);
    }
  }, [enabled, address, processorAddress, chainId, tokens, tokensLoading]);

  // Initial fetch when tokens are loaded
  useEffect(() => {
    fetchAllBalances();
  }, [fetchAllBalances]);

  // Auto-refresh interval
  useEffect(() => {
    if (!watch || !refetchInterval || !enabled) return;

    const interval = setInterval(() => {
      fetchAllBalances();
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [watch, refetchInterval, enabled, fetchAllBalances]);

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

  const filteredBalances = useMemo(() => getFilteredBalances(false), [getFilteredBalances]);

  return {
    balances,
    filteredBalances,
    loading: loading || tokensLoading,
    error,
    refetch: fetchAllBalances,
    getFilteredBalances,
  };
};
