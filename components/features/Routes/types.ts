import type { FiatCurrency } from '@/lib/currencies';

export interface OffRampRoute {
  id: string;
  label: string;
  targetCurrency: FiatCurrency;
  bankAccountId: string;
  status: 'ACTIVE' | 'PAUSED';
  depositAddress: string;
  safeWallet: { address: string; deployed: boolean };
  bankAccount: { currency: FiatCurrency; label: string };
  createdAt: string;
}

export interface OffRampExecution {
  id: string;
  routeId: string;
  status: string;
  depositTokenSymbol: string;
  depositTokenAmount: string;
  depositTxHash: string | null;
  conversionTxHash: string | null;
  krakenTokenSymbol: string | null;
  krakenTokenAmount: string | null;
  transferTxHash: string | null;
  krakenDepositRef: string | null;
  krakenPair: string | null;
  krakenOrderId: string | null;
  krakenFiatAmount: string | null;
  krakenWithdrawAmount: string | null;
  krakenWithdrawFee: string | null;
  bankTransferRef: string | null;
  error: string | null;
  createdAt: string;
}

export interface BankAccountRef {
  id: string;
  currency: FiatCurrency;
  label: string;
}
