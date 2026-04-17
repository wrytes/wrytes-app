import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWallet } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { AuthModal } from '@/components/auth/AuthModal';

export default function NavbarWallet() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();
  const { address: walletAddress, isConnected } = useWallet();

  const displayName = user?.telegramHandle
    ? `@${user.telegramHandle}`
    : user?.profile
      ? `${user.profile.firstName} ${user.profile.lastName}`.trim()
      : null;

  return (
    <>
      <div className="hidden md:flex items-center gap-3">
        {!isConnected ? (
          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg hover:bg-opacity-90 transition-colors text-sm font-medium"
          >
            <FontAwesomeIcon icon={faWallet} className="w-3 h-3" />
            Connect Wallet
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowAuthModal(true)}
            className="inline-flex items-center gap-2 text-text-primary hover:text-brand transition-colors text-sm font-medium"
            title="Click to manage wallet"
          >
            <div className="text-right">
              {displayName ? (
                <>
                  <p className="text-text-secondary font-medium text-sm leading-tight">{displayName}</p>
                  <p className="text-text-muted font-mono text-xs hover:text-brand transition-colors">
                    {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                  </p>
                </>
              ) : (
                <p className="text-text-secondary font-mono text-sm hover:text-brand transition-colors">
                  {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-6)}
                </p>
              )}
            </div>
          </button>
        )}
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
    </>
  );
}
