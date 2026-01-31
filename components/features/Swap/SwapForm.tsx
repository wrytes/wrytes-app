import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowsUpDown, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { SearchableTokenSelector } from '@/components/ui/TokenSelector';
import { useSwap } from '@/hooks/swap';
import { showToast } from '@/components/ui';
import { getOrderExplorerUrl } from '@/lib/swap/cow-sdk';
import { SlippageSettings } from './SlippageSettings';
import { QuoteDisplay } from './QuoteDisplay';

export const SwapForm: React.FC = () => {
  const [showSlippage, setShowSlippage] = useState(false);

  const {
    sellToken,
    buyToken,
    setSellToken,
    setBuyToken,
    switchTokens,
    sellAmount,
    buyAmount,
    setSellAmount,
    slippageBps,
    setSlippageBps,
    quote,
    isLoadingQuote,
    signingScheme,
    executeSwap,
    isExecuting,
    canSwap,
    validationError,
    error,
  } = useSwap();

  const handleSwap = async () => {
    try {
      const result = await executeSwap();
      showToast.success(
        `Order submitted! View on CoW Explorer`,
        {
          duration: 8000,
          id: `swap-${result.orderId}`,
        },
      );
    } catch {
      // Error is already set in useSwap
    }
  };

  return (
    <div className="space-y-4">
      {/* Sell section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-text-secondary text-sm font-medium">You sell</label>
          <button
            type="button"
            onClick={() => setShowSlippage(!showSlippage)}
            className="text-text-secondary text-xs hover:text-accent-orange transition-colors"
          >
            Slippage: {(slippageBps / 100).toFixed(1)}%
          </button>
        </div>

        {showSlippage && (
          <SlippageSettings slippageBps={slippageBps} onChange={setSlippageBps} />
        )}

        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="number"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              placeholder="0.00"
              step="any"
              min="0"
              className="w-full bg-dark-surface border border-gray-600 rounded-lg px-4 py-3 text-white text-lg placeholder-text-secondary focus:outline-none focus:border-accent-orange transition-colors"
            />
          </div>
          <div className="w-48">
            <SearchableTokenSelector
              selectedToken={sellToken}
              onChange={setSellToken}
              excludeToken={buyToken?.address}
            />
          </div>
        </div>
      </div>

      {/* Switch button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={switchTokens}
          className="p-2 rounded-full bg-dark-surface border border-gray-600 hover:border-accent-orange hover:bg-accent-orange/10 transition-colors"
        >
          <FontAwesomeIcon
            icon={faArrowsUpDown}
            className="w-4 h-4 text-text-secondary"
          />
        </button>
      </div>

      {/* Buy section */}
      <div className="space-y-2">
        <label className="text-text-secondary text-sm font-medium">You receive</label>
        <div className="flex gap-3">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={isLoadingQuote ? '' : buyAmount}
                readOnly
                placeholder={isLoadingQuote ? 'Fetching quote...' : '0.00'}
                className="w-full bg-dark-surface border border-gray-600 rounded-lg px-4 py-3 text-white text-lg placeholder-text-secondary cursor-default"
              />
              {isLoadingQuote && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="w-4 h-4 text-accent-orange animate-spin"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="w-48">
            <SearchableTokenSelector
              selectedToken={buyToken}
              onChange={setBuyToken}
              excludeToken={sellToken?.address}
            />
          </div>
        </div>
      </div>

      {/* Quote details */}
      {quote && sellToken && buyToken && (
        <QuoteDisplay
          quote={quote}
          sellToken={sellToken}
          buyToken={buyToken}
          signingScheme={signingScheme}
        />
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Swap button */}
      <button
        type="button"
        onClick={handleSwap}
        disabled={!canSwap}
        className={`
          w-full py-4 rounded-lg font-semibold text-lg transition-colors
          ${canSwap
            ? 'bg-accent-orange text-white hover:bg-accent-orange/90'
            : 'bg-gray-700 text-text-secondary cursor-not-allowed'}
        `}
      >
        {isExecuting ? (
          <span className="flex items-center justify-center gap-2">
            <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
            Swapping...
          </span>
        ) : (
          validationError || 'Swap'
        )}
      </button>
    </div>
  );
};
