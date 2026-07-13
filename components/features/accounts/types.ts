import type { FiatCurrency } from '@/lib/currencies';

export interface BankAccount {
  id: string;
  iban: string; // masked
  bic: string;
  currency: FiatCurrency;
  label: string;
  createdAt: string;
}

export interface SafeWallet {
  id: string;
  address: string;
  chainId: number;
  label: string;
  deployed: boolean;
}
