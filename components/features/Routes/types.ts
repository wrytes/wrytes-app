export interface OffRampRoute {
  id: string;
  label: string;
  targetCurrency: 'CHF' | 'EUR';
  bankAccountId: string;
  minTriggerAmount: string;
  status: 'ACTIVE' | 'PAUSED';
  depositAddress: string;
  safeWallet: { address: string; deployed: boolean };
  bankAccount: { currency: 'CHF' | 'EUR'; label: string };
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
  currency: 'CHF' | 'EUR';
  label: string;
}
