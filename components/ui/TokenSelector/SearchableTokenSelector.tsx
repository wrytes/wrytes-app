import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TokenConfig } from '@/lib/tokens/config';
import { TokenLogo } from '@/components/ui/TokenLogo';
import { useCowTokenList } from '@/hooks/tokens';

interface SearchableTokenSelectorProps {
  selectedToken: TokenConfig | null;
  onChange: (token: TokenConfig) => void;
  disabled?: boolean;
  error?: string;
  chainId?: number;
  excludeToken?: string; // address to exclude
  label?: string;
}

export const SearchableTokenSelector: React.FC<SearchableTokenSelectorProps> = ({
  selectedToken,
  onChange,
  disabled = false,
  error,
  chainId = 1,
  excludeToken,
  label,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { tokens, isLoading, searchTokens } = useCowTokenList(chainId);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Filter tokens
  const filtered = React.useMemo(() => {
    let results = debouncedQuery ? searchTokens(debouncedQuery) : tokens;
    if (excludeToken) {
      const excluded = excludeToken.toLowerCase();
      results = results.filter((t) => t.address.toLowerCase() !== excluded);
    }
    return results;
  }, [debouncedQuery, tokens, searchTokens, excludeToken]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = useCallback(
    (token: TokenConfig) => {
      onChange(token);
      setIsOpen(false);
      setQuery('');
    },
    [onChange],
  );

  const handleOpen = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    setQuery('');
    // Focus input after dropdown opens
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [disabled]);

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-text-secondary text-sm font-medium mb-2">
          {label}
        </label>
      )}

      {/* Trigger button */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`
          w-full flex items-center gap-3 bg-dark-surface border rounded-lg px-4 py-3
          text-left transition-colors
          ${error ? 'border-red-400' : isOpen ? 'border-accent-orange' : 'border-gray-600 hover:border-gray-500'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {selectedToken ? (
          <>
            <TokenLogo
              logoURI={selectedToken.logoURI}
              currency={selectedToken.symbol}
              size={6}
            />
            <div className="flex flex-col">
              <span className="text-white font-medium">{selectedToken.symbol}</span>
              <span className="text-text-secondary text-xs">{selectedToken.name}</span>
            </div>
          </>
        ) : (
          <span className="text-text-secondary">Select token</span>
        )}
        <svg
          className={`ml-auto w-4 h-4 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-dark-card border border-gray-600 rounded-lg shadow-xl overflow-hidden">
          {/* Search input */}
          <div className="p-3 border-b border-gray-600">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or symbol..."
              className="w-full bg-dark-surface border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-text-secondary focus:outline-none focus:border-accent-orange"
            />
          </div>

          {/* Token list */}
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-text-secondary text-sm">
                Loading tokens...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-center text-text-secondary text-sm">
                No tokens found
              </div>
            ) : (
              filtered.map((token) => (
                <button
                  key={token.address}
                  type="button"
                  onClick={() => handleSelect(token)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                    hover:bg-accent-orange/10
                    ${selectedToken?.address.toLowerCase() === token.address.toLowerCase()
                      ? 'bg-accent-orange/5 border-l-2 border-accent-orange'
                      : ''}
                  `}
                >
                  <TokenLogo
                    logoURI={token.logoURI}
                    currency={token.symbol}
                    size={6}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-white font-medium text-sm">{token.symbol}</span>
                    <span className="text-text-secondary text-xs truncate">{token.name}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
};
