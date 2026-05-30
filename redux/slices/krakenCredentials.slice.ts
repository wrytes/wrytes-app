import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface KrakenCredentialsState {
  apiKey: string;
  apiSecret: string;
  isConfigured: boolean;
}

const initialState: KrakenCredentialsState = {
  apiKey: '',
  apiSecret: '',
  isConfigured: false,
};

const krakenCredentialsSlice = createSlice({
  name: 'krakenCredentials',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ apiKey: string; apiSecret: string }>) {
      state.apiKey = action.payload.apiKey;
      state.apiSecret = action.payload.apiSecret;
      state.isConfigured = Boolean(action.payload.apiKey && action.payload.apiSecret);
    },
    clearCredentials(state) {
      state.apiKey = '';
      state.apiSecret = '';
      state.isConfigured = false;
    },
  },
});

export const { setCredentials, clearCredentials } = krakenCredentialsSlice.actions;
export const krakenCredentialsReducer = krakenCredentialsSlice.reducer;
