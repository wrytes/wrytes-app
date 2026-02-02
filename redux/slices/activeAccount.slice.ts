import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ActiveAccount, AccountType } from '@/lib/aragon/types';

interface ActiveAccountState {
  /** The currently selected account (wallet or DAO) */
  account: ActiveAccount | null;
  /** The connected wallet address (source of truth from wagmi) */
  connectedWallet: string | null;
  /** Last updated timestamp */
  lastUpdated: number;
}

const initialState: ActiveAccountState = {
  account: null,
  connectedWallet: null,
  lastUpdated: Date.now(),
};

export const activeAccountSlice = createSlice({
  name: 'activeAccount',
  initialState,
  reducers: {
    /**
     * Set the connected wallet address
     * This should be called when wallet connects/disconnects
     * If the current active account is the wallet, it will be updated
     */
    setConnectedWallet: (state, action: PayloadAction<string | null>) => {
      const walletAddress = action.payload;
      state.connectedWallet = walletAddress;

      // If no active account or active account was the wallet, update it
      if (!state.account || state.account.type === 'wallet') {
        if (walletAddress) {
          state.account = {
            address: walletAddress,
            type: 'wallet',
            name: 'Connected Wallet',
          };
        } else {
          state.account = null;
        }
      }

      state.lastUpdated = Date.now();
    },

    /**
     * Set the active account to a specific account
     */
    setActiveAccount: (state, action: PayloadAction<ActiveAccount>) => {
      state.account = action.payload;
      state.lastUpdated = Date.now();
    },

    /**
     * Reset to connected wallet as active account
     */
    resetToWallet: (state) => {
      if (state.connectedWallet) {
        state.account = {
          address: state.connectedWallet,
          type: 'wallet',
          name: 'Connected Wallet',
        };
      } else {
        state.account = null;
      }
      state.lastUpdated = Date.now();
    },

    /**
     * Clear the active account (on disconnect)
     */
    clearActiveAccount: (state) => {
      state.account = null;
      state.connectedWallet = null;
      state.lastUpdated = Date.now();
    },
  },
});

export const {
  setConnectedWallet,
  setActiveAccount,
  resetToWallet,
  clearActiveAccount,
} = activeAccountSlice.actions;

export const activeAccountReducer = activeAccountSlice.reducer;

// Selectors
export const selectActiveAccount = (state: { activeAccount: ActiveAccountState }) =>
  state.activeAccount.account;

export const selectConnectedWallet = (state: { activeAccount: ActiveAccountState }) =>
  state.activeAccount.connectedWallet;

export const selectIsWalletActive = (state: { activeAccount: ActiveAccountState }) =>
  state.activeAccount.account?.type === 'wallet';

export const selectIsDaoActive = (state: { activeAccount: ActiveAccountState }) =>
  state.activeAccount.account?.type === 'aragon-dao';
