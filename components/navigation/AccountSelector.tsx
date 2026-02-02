import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWallet,
  faUsers,
  faChevronDown,
  faCheck,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { useActiveAccount } from '@/hooks/account';
import { useAragonDaos } from '@/hooks/aragon';
import { AragonDao } from '@/lib/aragon/types';
import { ipfsToHttp } from '@/lib/utils';

interface AccountSelectorProps {
  className?: string;
}

export const AccountSelector: React.FC<AccountSelectorProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    activeAccount,
    connectedWallet,
    isConnected,
    isWalletActive,
    switchToDao,
    switchToWallet,
  } = useActiveAccount();

  const { daos, isLoading: daosLoading } = useAragonDaos(connectedWallet ?? undefined);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleSelectWallet = () => {
    switchToWallet();
    setIsOpen(false);
  };

  const handleSelectDao = (dao: AragonDao) => {
    switchToDao(dao);
    setIsOpen(false);
  };

  if (!isConnected) {
    return null;
  }

  const displayName = activeAccount?.name || formatAddress(activeAccount?.address || '');
  const displayAddress = activeAccount?.address ? formatAddress(activeAccount.address) : '';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-dark-surface border border-accent-orange/20 rounded-lg hover:border-accent-orange/50 transition-colors"
      >
        {/* Icon */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-orange/20 flex items-center justify-center overflow-hidden">
          {activeAccount?.avatar ? (
            <img
              src={ipfsToHttp(activeAccount.avatar) || ''}
              alt=""
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <FontAwesomeIcon
              icon={isWalletActive ? faWallet : faUsers}
              className="w-4 h-4 text-accent-orange"
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 text-left min-w-0">
          <div className="text-sm font-medium text-white truncate">{displayName}</div>
          <div className="text-xs text-text-secondary truncate">{displayAddress}</div>
        </div>

        {/* Chevron */}
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`w-3 h-3 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 md:mx-4 bg-dark-surface border border-accent-orange/20 rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Wallet Option */}
          <div className="p-2 border-b border-accent-orange/20">
            <div className="text-xs text-text-secondary px-2 py-1 uppercase tracking-wide">
              Wallet
            </div>
            <button
              onClick={handleSelectWallet}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent-orange/10 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-accent-orange/20 flex items-center justify-center">
                <FontAwesomeIcon icon={faWallet} className="w-3 h-3 text-accent-orange" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm text-white">Connected Wallet</div>
                <div className="text-xs text-text-secondary">
                  {connectedWallet ? formatAddress(connectedWallet) : ''}
                </div>
              </div>
              {isWalletActive && (
                <FontAwesomeIcon icon={faCheck} className="w-4 h-4 text-green-400" />
              )}
            </button>
          </div>

          {/* DAOs Section */}
          <div className="p-2 max-h-64 overflow-y-auto">
            <div className="text-xs text-text-secondary px-2 py-1 uppercase tracking-wide flex items-center gap-2">
              Aragon DAOs
              {daosLoading && <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />}
            </div>

            {daos.length === 0 && !daosLoading && (
              <div className="px-3 py-2 text-xs text-text-secondary">
                No DAOs found for this wallet
              </div>
            )}

            {daos.map(dao => {
              const isSelected = activeAccount?.address === dao.address;
              return (
                <button
                  key={dao.id}
                  onClick={() => handleSelectDao(dao)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent-orange/10 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-accent-orange/20 flex items-center justify-center overflow-hidden">
                    {dao.avatar ? (
                      <img
                        src={ipfsToHttp(dao.avatar) || ''}
                        alt=""
                        className="w-6 h-6 object-cover"
                      />
                    ) : (
                      <FontAwesomeIcon icon={faUsers} className="w-3 h-3 text-accent-orange" />
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm text-white truncate">{dao.name}</div>
                    <div className="text-xs text-text-secondary truncate">
                      {formatAddress(dao.address)}
                    </div>
                  </div>
                  {isSelected && (
                    <FontAwesomeIcon icon={faCheck} className="w-4 h-4 text-green-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
