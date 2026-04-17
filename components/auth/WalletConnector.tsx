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

  // TG approval countdown
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

  // When wallet becomes linked → auto-retry sign-in
  useEffect(() => {
    if (link.step === 'linked' && address && authFlow?.currentStep === AuthStep.WALLET_NOT_LINKED) {
      link.reset();
      // Small delay so the user sees the "linked" confirmation
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

  // Derived display flags
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
        <p className="text-gray-400 text-sm">
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
            <FontAwesomeIcon
              icon={faSpinner}
              className="text-2xl text-orange-500 animate-spin mb-2"
            />
            <p className="text-gray-300 text-sm">
              {isConnecting
                ? 'Connecting wallet…'
                : isSigning
                  ? 'Waiting for signature…'
                  : 'Submitting…'}
            </p>
          </motion.div>
        )}

        {/* Connect */}
        {showConnect && (
          <motion.div
            key="connect"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ButtonInput
              label="Connect Wallet"
              onClick={handleConnect}
              className="w-full mb-4"
              variant="primary"
            />
          </motion.div>
        )}

        {/* Sign */}
        {showSign && (
          <motion.div
            key="sign"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="mb-4 p-3 bg-gray-800/50 rounded-lg text-left">
              <p className="text-xs text-gray-400 mb-1">Connected</p>
              <p className="text-sm text-text-primary font-mono truncate">{address}</p>
            </div>
            <ButtonInput
              label={authFlow?.error ? 'Retry Sign' : 'Sign Message'}
              icon={<FontAwesomeIcon icon={faCheck} />}
              onClick={handleSign}
              className="w-full"
              variant="primary"
              second={{
                label: 'Disconnect',
                onClick: signOut,
                variant: 'secondary',
                className: 'w-full',
              }}
              layout="col"
            />
          </motion.div>
        )}

        {/* Wallet not linked → link flow */}
        {showNotLinked && (
          <motion.div
            key="not-linked"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            {/* Step: idle — prompt to generate token */}
            {(link.step === 'idle' || link.step === 'error') && (
              <>
                <div className="p-3 bg-gray-800/60 rounded-lg text-left">
                  <p className="text-xs text-gray-400 mb-1">Wallet</p>
                  <p className="text-sm text-text-primary font-mono truncate">{address}</p>
                </div>
                <p className="text-xs text-gray-500 px-1">
                  This wallet isn&apos;t linked to a Telegram account yet. Generate a link token,
                  then send it to the bot.
                </p>
                {link.error && <p className="text-xs text-red-400">{link.error}</p>}
                <ButtonInput
                  label={link.step === 'error' ? 'Try Again' : 'Generate Link Token'}
                  icon={<FontAwesomeIcon icon={faLink} />}
                  onClick={link.generateToken}
                  className="w-full"
                  variant="primary"
                  second={{
                    label: 'Disconnect',
                    onClick: signOut,
                    variant: 'secondary',
                    className: 'w-full',
                  }}
                  layout="col"
                />
              </>
            )}

            {/* Step: signing — waiting for wallet signature */}
            {link.step === 'signing' && (
              <div className="py-4">
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="text-2xl text-orange-500 animate-spin mb-2"
                />
                <p className="text-gray-300 text-sm">Sign the ownership message…</p>
              </div>
            )}

            {/* Step: pending — show token to paste in TG */}
            {link.step === 'pending' && link.token && (
              <>
                <div className="p-3 bg-gray-800/60 rounded-lg text-left">
                  <p className="text-xs text-gray-400 mb-2">Send this command in Telegram:</p>
                  <div
                    className="flex items-center justify-between bg-gray-900 rounded px-3 py-2 cursor-pointer group"
                    onClick={handleCopy}
                  >
                    <code className="text-orange-400 text-sm font-mono break-all select-all">
                      /link {link.token}
                    </code>
                    <FontAwesomeIcon
                      icon={copied ? faCheckCircle : faCopy}
                      className={`ml-2 text-sm flex-shrink-0 ${copied ? 'text-green-400' : 'text-gray-500 group-hover:text-gray-300'}`}
                    />
                  </div>
                  {link.secondsLeft !== null && (
                    <p
                      className={`text-xs mt-2 ${link.secondsLeft < 60 ? 'text-red-400' : 'text-gray-500'}`}
                    >
                      Expires in {link.secondsLeft}s
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-800/40 rounded text-xs text-gray-400">
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin text-orange-400" />
                  Waiting for you to send the command in Telegram…
                </div>
                <button
                  onClick={link.reset}
                  className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                >
                  Start over
                </button>
              </>
            )}

            {/* Step: linked */}
            {link.step === 'linked' && (
              <div className="py-4">
                <FontAwesomeIcon icon={faCheckCircle} className="text-2xl text-green-500 mb-2" />
                <p className="text-text-primary text-sm font-medium">Wallet linked!</p>
                <p className="text-gray-400 text-xs mt-1">Signing you in…</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Waiting for Telegram 2FA approval */}
        {showTgWait && (
          <motion.div
            key="tg-waiting"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="py-2"
          >
            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex items-center justify-center w-14 h-14 rounded-full border-2 border-orange-500 bg-orange-500/10 mb-3"
            >
              <FontAwesomeIcon icon={faPaperPlane} className="text-xl text-orange-500" />
            </motion.div>
            <p className="text-text-primary text-sm font-medium mb-1">Approve in Telegram</p>
            <p className="text-gray-400 text-xs mb-3">
              A sign-in request was sent to your Telegram. Tap <strong>Allow</strong> to continue.
            </p>
            {tgSecondsLeft !== null && (
              <p
                className={`text-xs mb-4 ${tgSecondsLeft < 30 ? 'text-red-400' : 'text-gray-500'}`}
              >
                Expires in {tgSecondsLeft}s
              </p>
            )}
            <ButtonInput label="Cancel" onClick={signOut} className="w-full" variant="secondary" />
          </motion.div>
        )}

        {/* Authenticated */}
        {showDone && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="mb-4 p-3 bg-green-900/20 rounded-lg">
              <FontAwesomeIcon icon={faCheck} className="text-green-500 text-lg mb-2" />
              <p className="text-xs text-gray-400 mb-1">Authenticated</p>
              <p className="text-sm text-text-primary font-mono truncate">{address}</p>
            </div>
            <ButtonInput
              label="Disconnect"
              onClick={signOut}
              className="w-full"
              variant="secondary"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error (not shown during not-linked or TG wait flows which handle errors inline) */}
      {error && !showNotLinked && !showTgWait && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-red-900/20 rounded-lg"
        >
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 mr-2" />
          <span className="text-red-400 text-sm">{error}</span>
        </motion.div>
      )}
    </div>
  );
}
