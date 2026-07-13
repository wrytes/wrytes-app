import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWallet } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { AuthModal } from '@/components/auth/AuthModal';

export default function WalletButton() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { activeNamespace } = useAuth();
  const { address: walletAddress, isConnected } = useWallet();

  return (
    <>
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
            {activeNamespace && (
              <p className="text-brand text-xs font-medium leading-tight truncate max-w-[140px]">
                📦 {activeNamespace.name}
              </p>
            )}
            <p className="text-text-muted font-mono text-xs hover:text-brand transition-colors">
              {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
            </p>
          </div>
        </button>
      )}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
    </>
  );
}
