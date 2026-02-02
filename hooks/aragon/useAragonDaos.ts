import { useState, useEffect, useCallback } from 'react';
import { AragonDao, AragonDaoListResponse } from '@/lib/aragon/types';

const ARAGON_API_BASE = 'https://app.aragon.org/api/backend/v2';

interface UseAragonDaosOptions {
  /** Network to query (default: ethereum-mainnet) */
  network?: string;
  /** Enable/disable fetching */
  enabled?: boolean;
}

interface UseAragonDaosReturn {
  daos: AragonDao[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch DAOs where a given address is a member
 * Uses the Aragon API to get DAO membership data
 */
export function useAragonDaos(
  memberAddress: string | undefined,
  options: UseAragonDaosOptions = {}
): UseAragonDaosReturn {
  const { network = 'ethereum-mainnet', enabled = true } = options;

  const [daos, setDaos] = useState<AragonDao[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDaos = useCallback(async () => {
    if (!memberAddress || !enabled) {
      setDaos([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const url = new URL(`${ARAGON_API_BASE}/daos/member/${memberAddress}`);
      url.searchParams.set('sort', 'blockTimestamp');
      url.searchParams.set('networks', network);

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Failed to fetch DAOs: ${response.status} ${response.statusText}`);
      }

      const data: AragonDaoListResponse = await response.json();
      setDaos(data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Aragon DAOs';
      setError(errorMessage);
      console.error('Error fetching Aragon DAOs:', err);
      setDaos([]);
    } finally {
      setIsLoading(false);
    }
  }, [memberAddress, network, enabled]);

  useEffect(() => {
    fetchDaos();
  }, [fetchDaos]);

  return {
    daos,
    isLoading,
    error,
    refetch: fetchDaos,
  };
}
