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
  tokenSymbol: string;
  tokenAmount: string;
  fiatAmount: string | null;
  bankTransferRef: string | null;
  error: string | null;
  createdAt: string;
}

export interface BankAccountRef {
  id: string;
  currency: FiatCurrency;
  label: string;
}
