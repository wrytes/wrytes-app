export interface BankAccount {
  id: string;
  iban: string; // masked
  bic: string;
  holderName: string;
  currency: 'CHF' | 'EUR';
  label: string;
  isDefault: boolean;
  createdAt: string;
}

export interface SafeWallet {
  id: string;
  address: string;
  chainId: number;
  label: string;
  deployed: boolean;
}
