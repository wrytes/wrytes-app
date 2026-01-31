import { TokenConfig } from '@/lib/tokens/config';

export type SwapSigningScheme = 'eip712' | 'erc1271' | 'presign';

export interface SwapQuote {
  sellAmount: bigint;
  buyAmount: bigint;
  feeAmount: bigint;
  validTo: number;
  // Amounts after fees & slippage
  minimumReceived: bigint;
  // Rate info
  exchangeRate: string; // human-readable rate
  // Fee breakdown
  networkFeeSellCurrency: bigint;
  protocolFeeBps: number;
}

export interface SwapState {
  sellToken: TokenConfig | null;
  buyToken: TokenConfig | null;
  sellAmount: string;
  buyAmount: string;
  slippageBps: number;
  quote: SwapQuote | null;
  signingScheme: SwapSigningScheme;
  isLoadingQuote: boolean;
  isExecuting: boolean;
  error: string | null;
}

export interface SwapExecutionResult {
  orderId: string;
  txHash?: string;
  signingScheme: SwapSigningScheme;
}
