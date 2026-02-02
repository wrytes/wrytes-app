import { useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useAccount } from 'wagmi';
import { RootState } from '@/redux/redux.store';
import {
  setConnectedWallet,
  setActiveAccount,
  resetToWallet,
  clearActiveAccount,
  selectActiveAccount,
  selectConnectedWallet,
  selectIsWalletActive,
  selectIsDaoActive,
} from '@/redux/slices/activeAccount.slice';
import { ActiveAccount, AragonDao } from '@/lib/aragon/types';

/**
 * Hook to manage the active account (wallet or DAO)
 * Syncs with wagmi's connected wallet and allows switching to DAOs
 */
export function useActiveAccount() {
  const dispatch = useDispatch();
  const { address: connectedAddress, isConnected } = useAccount();

  // Selectors
  const activeAccount = useSelector((state: RootState) => selectActiveAccount(state));
  const connectedWallet = useSelector((state: RootState) => selectConnectedWallet(state));
  const isWalletActive = useSelector((state: RootState) => selectIsWalletActive(state));
  const isDaoActive = useSelector((state: RootState) => selectIsDaoActive(state));

  // Sync connected wallet address with Redux
  useEffect(() => {
    if (isConnected && connectedAddress) {
      dispatch(setConnectedWallet(connectedAddress));
    } else {
      dispatch(clearActiveAccount());
    }
  }, [isConnected, connectedAddress, dispatch]);

  // Switch to a DAO
  const switchToDao = useCallback(
    (dao: AragonDao) => {
      const account: ActiveAccount = {
        address: dao.address,
        type: 'aragon-dao',
        name: dao.name,
        avatar: dao.avatar,
        daoMetadata: {
          ens: dao.ens,
          network: dao.network,
          description: dao.description,
        },
      };
      dispatch(setActiveAccount(account));
    },
    [dispatch]
  );

  // Switch back to connected wallet
  const switchToWallet = useCallback(() => {
    dispatch(resetToWallet());
  }, [dispatch]);

  // Set any active account
  const setAccount = useCallback(
    (account: ActiveAccount) => {
      dispatch(setActiveAccount(account));
    },
    [dispatch]
  );

  return {
    // Current state
    activeAccount,
    connectedWallet,
    isConnected,
    isWalletActive,
    isDaoActive,
    // Active address (convenience)
    activeAddress: activeAccount?.address ?? null,
    // Actions
    switchToDao,
    switchToWallet,
    setAccount,
  };
}
