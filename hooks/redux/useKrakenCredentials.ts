import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '@/redux/redux.store';
import {
  setCredentials,
  clearCredentials,
  type KrakenCredentialsState,
} from '@/redux/slices/krakenCredentials.slice';

export function useKrakenCredentials() {
  const dispatch = useDispatch<AppDispatch>();
  const { apiKey, apiSecret, isConfigured } = useSelector(
    (state: { krakenCredentials: KrakenCredentialsState }) => state.krakenCredentials
  );

  return {
    apiKey,
    apiSecret,
    isConfigured,
    save: (key: string, secret: string) => dispatch(setCredentials({ apiKey: key, apiSecret: secret })),
    clear: () => dispatch(clearCredentials()),
  };
}
