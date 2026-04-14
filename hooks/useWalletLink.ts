import { useState, useEffect, useRef, useCallback } from 'react';
import { type Address } from 'viem';
import { useSignMessage } from 'wagmi';
import { AuthService } from '@/lib/auth/AuthService';

export type LinkStep = 'idle' | 'signing' | 'pending' | 'linked' | 'error';

interface WalletLinkState {
  step: LinkStep;
  token: string | null;
  expiresAt: Date | null;
  error: string | null;
  secondsLeft: number | null;
}

export function useWalletLink(address: Address | null | undefined) {
  const authService = AuthService.getInstance();
  const { signMessageAsync } = useSignMessage();

  const [state, setState] = useState<WalletLinkState>({
    step: 'idle',
    token: null,
    expiresAt: null,
    error: null,
    secondsLeft: null,
  });

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tokenRef = useRef<string | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const startCountdown = useCallback((expiresAt: Date) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    const tick = () => {
      const left = Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / 1000));
      setState(s => ({ ...s, secondsLeft: left }));
    };
    tick();
    countdownRef.current = setInterval(tick, 1000);
  }, []);

  const startPolling = useCallback(
    (token: string) => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      tokenRef.current = token;

      pollingRef.current = setInterval(async () => {
        try {
          const result = await authService.getLinkTokenStatus(tokenRef.current!);
          if (result.status === 'linked') {
            stopPolling();
            setState(s => ({ ...s, step: 'linked' }));
          } else if (result.status === 'expired' || result.status === 'invalid') {
            stopPolling();
            setState(s => ({ ...s, step: 'error', error: 'Token expired. Generate a new one.' }));
          }
          // 'pending' → keep polling
        } catch {
          // network glitch — keep polling
        }
      }, 2000);
    },
    [authService, stopPolling]
  );

  const generateToken = useCallback(async () => {
    if (!address) return;
    stopPolling();
    setState({ step: 'signing', token: null, expiresAt: null, error: null, secondsLeft: null });

    try {
      const message = authService.getLinkMessage(address);
      const signature = (await signMessageAsync({ message })) as `0x${string}`;

      const { token, expiresAt: expiresAtStr } = await authService.createLinkToken(
        address,
        message,
        signature
      );
      const expiresAt = new Date(expiresAtStr);

      setState({ step: 'pending', token, expiresAt, error: null, secondsLeft: null });
      startCountdown(expiresAt);
      startPolling(token);
    } catch (err: unknown) {
      let error = 'Failed to generate link token';
      if (err instanceof Error) {
        if (err.name === 'UserRejectedRequestError' || err.message.includes('User rejected')) {
          error = 'Signature cancelled.';
        } else {
          error = err.message;
        }
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        error = (err as { message: string }).message;
      }
      setState(s => ({ ...s, step: 'error', error }));
    }
  }, [address, authService, signMessageAsync, startCountdown, startPolling, stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setState({ step: 'idle', token: null, expiresAt: null, error: null, secondsLeft: null });
  }, [stopPolling]);

  return { ...state, generateToken, reset };
}
