import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSpinner,
  faExclamationTriangle,
  faCheck,
  faPaperPlane,
  faLink,
  faCopy,
  faCheckCircle,
} from '@fortawesome/free-solid-svg-icons';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import { useWalletLink } from '@/hooks/useWalletLink';
import { AuthStep } from '@/lib/auth/types';
import ButtonInput from '@/components/ui/Input/ButtonInput';
import { useAppKit } from '@reown/appkit/react';

interface WalletConnectorProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export function WalletConnector({ onSuccess, onError, className = '' }: WalletConnectorProps) {
  const { isConnected, isConnecting, address, error: walletError, clearWalletError } = useWallet();
  const {
    signIn,
    signOut,
    isLoading: authLoading,
    error: authError,
    clearError,
    isAuthenticated,
    authFlow,
  } = useAuth();
  const link = useWalletLink(address ?? null);
  const { open } = useAppKit();

  const [isSigning, setIsSigning] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [tgSecondsLeft, setTgSecondsLeft] = useState<number | null>(null);
  useEffect(() => {
    if (authFlow?.currentStep !== AuthStep.PENDING_TG_APPROVAL || !authFlow.sessionExpiresAt) {
      setTgSecondsLeft(null);
      return;
    }
    const tick = () =>
      setTgSecondsLeft(
        Math.max(0, Math.round((authFlow.sessionExpiresAt!.getTime() - Date.now()) / 1000))
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [authFlow?.currentStep, authFlow?.sessionExpiresAt]);

  useEffect(() => {
    if (link.step === 'linked' && address && authFlow?.currentStep === AuthStep.WALLET_NOT_LINKED) {
      link.reset();
      setTimeout(() => signIn(address), 1200);
    }
  }, [link.step]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConnect = () => {
    clearWalletError();
    clearError();
    open();
  };

  const handleSign = async () => {
    if (!address) return;
    setIsSigning(true);
    clearError();
    try {
      await signIn(address);
      onSuccess?.();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsSigning(false);
    }
  };

  const handleCopy = () => {
    if (!link.token) return;
    navigator.clipboard.writeText(`/link ${link.token}`);
    setCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
  };

  const step = authFlow?.currentStep ?? AuthStep.CONNECT_WALLET;
  const isLoading = isConnecting || authLoading || isSigning;
  const error = walletError || authError;

  const showConnect = !isConnected && !isLoading;
  const showSign = isConnected && !isAuthenticated && step === AuthStep.SIGN_MESSAGE && !isLoading;
  const showNotLinked = isConnected && step === AuthStep.WALLET_NOT_LINKED;
  const showTgWait = step === AuthStep.PENDING_TG_APPROVAL;
  const showDone = isAuthenticated;

  return (
    <div className={`text-center max-w-md mx-auto ${className}`}>
      {/* Status line */}
      <div className="mb-4">
        <p className="text-text-muted text-sm">
          {showDone
            ? 'You are successfully authenticated'
            : showTgWait
              ? 'Check Telegram and tap Allow'
              : showNotLinked
                ? 'Link your wallet to continue'
                : isConnected
                  ? authFlow?.error
                    ? 'Please try again'
                    : 'Sign a message to continue'
                  : 'Connect your Web3 wallet to continue'}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* Loading */}
        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="py-4"
          >
            <FontAwesomeIcon icon={faSpinner} className="text-2xl text-brand animate-spin mb-2" />
            <p className="text-text-secondary text-sm">
              {isConnecting ? 'Connecting wallet…' : isSigning ? 'Waiting for signature…' : 'Submitting…'}
            </p>
          </motion.div>
        )}

        {/* Connect */}
        {showConnect && (
          <motion.div key="connect" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <ButtonInput label="Connect Wallet" onClick={handleConnect} className="w-full mb-4" variant="primary" />
          </motion.div>
        )}

        {/* Sign */}
        {showSign && (
          <motion.div key="sign" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="mb-4 p-3 bg-surface rounded-lg text-left">
              <p className="text-xs text-text-muted mb-1">Connected</p>
              <p className="text-sm text-text-primary font-mono truncate">{address}</p>
            </div>
            <ButtonInput
              label={authFlow?.error ? 'Retry Sign' : 'Sign Message'}
              icon={<FontAwesomeIcon icon={faCheck} />}
              onClick={handleSign}
              className="w-full"
              variant="primary"
              second={{ label: 'Disconnect', onClick: signOut, variant: 'secondary', className: 'w-full' }}
              layout="col"
            />
          </motion.div>
        )}

        {/* Wallet not linked */}
        {showNotLinked && (
          <motion.div key="not-linked" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
            {(link.step === 'idle' || link.step === 'error') && (
              <>
                <div className="p-3 bg-surface rounded-lg text-left">
                  <p className="text-xs text-text-muted mb-1">Wallet</p>
                  <p className="text-sm text-text-primary font-mono truncate">{address}</p>
                </div>
                <p className="text-xs text-text-muted px-1">
                  This wallet isn&apos;t linked to a Telegram account yet. Generate a link token, then send it to the bot.
                </p>
                {link.error && <p className="text-xs text-error">{link.error}</p>}
                <ButtonInput
                  label={link.step === 'error' ? 'Try Again' : 'Generate Link Token'}
                  icon={<FontAwesomeIcon icon={faLink} />}
                  onClick={link.generateToken}
                  className="w-full"
                  variant="primary"
                  second={{ label: 'Disconnect', onClick: signOut, variant: 'secondary', className: 'w-full' }}
                  layout="col"
                />
              </>
            )}

            {link.step === 'signing' && (
              <div className="py-4">
                <FontAwesomeIcon icon={faSpinner} className="text-2xl text-brand animate-spin mb-2" />
                <p className="text-text-secondary text-sm">Sign the ownership message…</p>
              </div>
            )}

            {link.step === 'pending' && link.token && (
              <>
                <div className="p-3 bg-surface rounded-lg text-left">
                  <p className="text-xs text-text-muted mb-2">Send this command in Telegram:</p>
                  <div
                    className="flex items-center justify-between bg-base rounded px-3 py-2 cursor-pointer group border border-input-border"
                    onClick={handleCopy}
                  >
                    <code className="text-brand text-sm font-mono break-all select-all">
                      /link {link.token}
                    </code>
                    <FontAwesomeIcon
                      icon={copied ? faCheckCircle : faCopy}
                      className={`ml-2 text-sm flex-shrink-0 ${copied ? 'text-success' : 'text-text-muted group-hover:text-text-secondary'}`}
                    />
                  </div>
                  {link.secondsLeft !== null && (
                    <p className={`text-xs mt-2 ${link.secondsLeft < 60 ? 'text-error' : 'text-text-muted'}`}>
                      Expires in {link.secondsLeft}s
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 p-2 bg-surface rounded text-xs text-text-muted border border-input-border">
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin text-brand" />
                  Waiting for you to send the command in Telegram…
                </div>
                <button onClick={link.reset} className="text-xs text-text-muted hover:text-text-secondary transition-colors">
                  Start over
                </button>
              </>
            )}

            {link.step === 'linked' && (
              <div className="py-4">
                <FontAwesomeIcon icon={faCheckCircle} className="text-2xl text-success mb-2" />
                <p className="text-text-primary text-sm font-medium">Wallet linked!</p>
                <p className="text-text-muted text-xs mt-1">Signing you in…</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Waiting for Telegram 2FA */}
        {showTgWait && (
          <motion.div key="tg-waiting" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="py-2">
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-full border-2 border-brand bg-brand/10 mb-3"
            >
              <FontAwesomeIcon icon={faPaperPlane} className="text-xl text-brand" />
            </motion.div>
            <p className="text-text-primary text-sm font-medium mb-1">Approve in Telegram</p>
            <p className="text-text-muted text-xs mb-3">
              A sign-in request was sent to your Telegram. Tap <strong>Allow</strong> to continue.
            </p>
            {tgSecondsLeft !== null && (
              <p className={`text-xs mb-4 ${tgSecondsLeft < 30 ? 'text-error' : 'text-text-muted'}`}>
                Expires in {tgSecondsLeft}s
              </p>
            )}
            <ButtonInput label="Cancel" onClick={signOut} className="w-full" variant="secondary" />
          </motion.div>
        )}

        {/* Authenticated */}
        {showDone && (
          <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="mb-4 p-3 bg-success-bg border border-success-border rounded-lg">
              <FontAwesomeIcon icon={faCheck} className="text-success text-lg mb-2" />
              <p className="text-xs text-text-muted mb-1">Authenticated</p>
              <p className="text-sm text-text-primary font-mono truncate">{address}</p>
            </div>
            <ButtonInput label="Disconnect" onClick={signOut} className="w-full" variant="secondary" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && !showNotLinked && !showTgWait && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-error-bg border border-error-border rounded-lg"
        >
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-error mr-2" />
          <span className="text-error text-sm">{error}</span>
        </motion.div>
      )}
    </div>
  );
}
