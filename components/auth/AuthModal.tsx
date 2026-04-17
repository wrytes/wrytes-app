import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { WalletConnector } from './WalletConnector';
import { AuthStepper } from './AuthStepper';
import { useAuth } from '@/hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  title = 'Authentication Required',
  description = 'Please connect your wallet and sign a message to continue.',
}: AuthModalProps) {
  const { isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = () => {};

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const clearError = () => {
    setError(null);
  };

  React.useEffect(() => {
    if (isAuthenticated && isOpen) {
      handleSuccess();
    }
  }, [isAuthenticated, isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-surface rounded-lg border border-surface overflow-hidden">
              {/* Header */}
              <div className="px-6 py-4 border-b border-surface">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-text-primary">{title}</h2>
                    <p className="text-sm text-text-muted mt-1">{description}</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-text-muted hover:text-text-primary transition-colors p-2 rounded-lg hover:bg-surface"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="mb-6">
                  <AuthStepper onComplete={onClose} />
                </div>

                <WalletConnector
                  className="border-0 bg-transparent p-0 shadow-none"
                  onSuccess={handleSuccess}
                  onError={handleError}
                />

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 bg-error-bg border border-error-border rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-error text-sm">{error}</span>
                      <button onClick={clearError} className="text-error hover:text-error ml-2">
                        <FontAwesomeIcon icon={faTimes} className="text-xs" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-input-border">
                <div className="text-xs text-text-muted text-center space-y-1">
                  <p>🔒 Secure wallet-based authentication</p>
                  <p>No passwords or personal information required</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
