import { useState, useEffect, useCallback, useMemo } from 'react';
import { TokenConfig } from '@/lib/tokens/config';
import {
  fetchCowTokenList,
  getMergedTokenList,
  searchTokens as searchTokensFn,
  getTokenByAddress as getTokenByAddressFn,
} from '@/lib/tokens/cow-service';

interface UseCowTokenListReturn {
  tokens: TokenConfig[];
  isLoading: boolean;
  error: string | null;
  searchTokens: (query: string) => TokenConfig[];
  getTokenByAddress: (address: string) => TokenConfig | undefined;
}

export function useCowTokenList(chainId: number = 1): UseCowTokenListReturn {
  const [tokens, setTokens] = useState<TokenConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const cowTokens = await fetchCowTokenList();
        if (!cancelled) {
          setTokens(getMergedTokenList(cowTokens, chainId));
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load token list',
          );
          // Fallback: merge empty CoW list (returns just custom tokens)
          setTokens(getMergedTokenList([], chainId));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [chainId]);

  const searchTokens = useCallback(
    (query: string) => searchTokensFn(tokens, query),
    [tokens],
  );

  const getTokenByAddress = useCallback(
    (address: string) => getTokenByAddressFn(tokens, address),
    [tokens],
  );

  return useMemo(
    () => ({ tokens, isLoading, error, searchTokens, getTokenByAddress }),
    [tokens, isLoading, error, searchTokens, getTokenByAddress],
  );
}
