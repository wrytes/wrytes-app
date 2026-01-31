import React from 'react';
import { TokenConfig } from '@/lib/tokens/config';
import { TokenLogo } from '@/components/ui/TokenLogo';
import { TokenSelectorProps } from './types';
import { useCowTokenList } from '@/hooks/tokens';

export const TokenSelector: React.FC<TokenSelectorProps> = ({
  selectedToken,
  onChange,
  title = "Token",
  disabled = false,
  error,
  className = "",
  availableTokens
}) => {
  const { tokens, isLoading, getTokenByAddress } = useCowTokenList();

  // Get available tokens (filter by symbol if specified)
  const getAvailableTokens = (): TokenConfig[] => {
    if (availableTokens && availableTokens.length > 0) {
      return tokens.filter((t) => availableTokens.includes(t.symbol));
    }
    return tokens;
  };

  const handleTokenChange = (tokenAddress: string) => {
    const tokenConfig = getTokenByAddress(tokenAddress);
    if (tokenConfig) {
      onChange(tokenAddress, tokenConfig);
    }
  };

  const availableTokensList = getAvailableTokens();
  const selectedTokenConfig = selectedToken ? getTokenByAddress(selectedToken) : undefined;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="block text-text-secondary text-sm font-medium">
          {title}
        </label>
      </div>

      {/* Select */}
      <div className="relative">
        <select
          value={selectedToken}
          onChange={(e) => handleTokenChange(e.target.value)}
          disabled={disabled || isLoading}
          className={`
            w-full bg-dark-surface border rounded-lg px-4 py-3
            text-white
            focus:outline-none transition-colors
            ${error
              ? 'border-red-400 focus:border-red-400'
              : 'border-gray-600 focus:border-accent-orange'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <option value="" disabled>
            {isLoading ? 'Loading tokens...' : 'Select a token'}
          </option>
          {availableTokensList.map((config) => (
            <option key={config.address} value={config.address}>
              {config.symbol} - {config.name} ({config.decimals} decimals)
            </option>
          ))}
        </select>
      </div>

      {/* Token Info */}
      {selectedToken && selectedTokenConfig && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <TokenLogo
              logoURI={selectedTokenConfig.logoURI}
              currency={selectedTokenConfig.symbol}
              size={4}
            />
            <span className="text-text-secondary">
              {selectedTokenConfig.symbol} - {selectedTokenConfig.name}
            </span>
          </div>
          <span className="text-text-secondary">
            Decimals: {selectedTokenConfig.decimals}
          </span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-red-400 text-xs mt-1">{error}</p>
      )}
    </div>
  );
};
