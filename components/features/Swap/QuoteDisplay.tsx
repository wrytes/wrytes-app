import React from 'react';
import { formatUnits } from 'viem';
import { TokenConfig } from '@/lib/tokens/config';
import { SwapQuote, SwapSigningScheme } from '@/lib/swap/types';

interface QuoteDisplayProps {
  quote: SwapQuote;
  sellToken: TokenConfig;
  buyToken: TokenConfig;
  signingScheme: SwapSigningScheme;
}

const SCHEME_LABELS: Record<SwapSigningScheme, string> = {
  eip712: 'EIP-712',
  erc1271: 'ERC-1271',
  presign: 'Pre-sign',
};

export const QuoteDisplay: React.FC<QuoteDisplayProps> = ({
  quote,
  sellToken,
  buyToken,
  signingScheme,
}) => {
  const minimumReceived = formatUnits(quote.minimumReceived, buyToken.decimals);
  const networkFee = formatUnits(quote.networkFeeSellCurrency, sellToken.decimals);

  return (
    <div className="space-y-3 p-4 bg-dark-surface border border-gray-600 rounded-lg">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">Rate</span>
        <span className="text-white">
          1 {sellToken.symbol} = {quote.exchangeRate} {buyToken.symbol}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">Network fee</span>
        <span className="text-white">
          {parseFloat(networkFee) < 0.0001
            ? '< 0.0001'
            : parseFloat(networkFee).toFixed(4)}{' '}
          {sellToken.symbol}
        </span>
      </div>

      {quote.protocolFeeBps > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Protocol fee</span>
          <span className="text-white">
            {(quote.protocolFeeBps / 100).toFixed(2)}%
          </span>
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">Minimum received</span>
        <span className="text-white">
          {parseFloat(minimumReceived).toFixed(6)} {buyToken.symbol}
        </span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">Signing method</span>
        <span className="text-accent-orange font-medium">
          {SCHEME_LABELS[signingScheme]}
        </span>
      </div>
    </div>
  );
};
