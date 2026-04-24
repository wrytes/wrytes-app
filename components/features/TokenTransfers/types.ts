export interface WalletAddress {
  id: string
  address: string
  label: string | null
  chain: string
  chainId: number
  lastSyncedAt: string | null
}

export type TransferClassification =
  | 'CAPITAL'
  | 'INCOME'
  | 'LOAN'
  | 'REPAYMENT'
  | 'EXPENSE'
  | 'NEUTRAL'
  | 'SWAP_IN'
  | 'SWAP_OUT'
  | 'PAYMENT'
  | 'UNCLASSIFIED'
  // legacy
  | 'ASSET'
  | 'LIABILITY'
  | 'RECEIVED'
  | 'TRANSFER'
  | 'SKIPPED'

export interface Transfer {
  id: string
  txHash: string
  timestamp: string | null
  direction: 'IN' | 'OUT'
  tokenAddress: string | null
  tokenSymbol: string | null
  amountFormatted: string | null
  classification: TransferClassification
  isHidden: boolean
  chfValue: string | null
  notes: string | null
}

export interface BlacklistEntry {
  id: string
  tokenAddress: string
  chainId: number
  tokenSymbol: string | null
  reason: string | null
}

export interface TokenOverviewToken {
  tokenSymbol: string | null
  tokenAddress: string | null
  asset: number
  liability: number
  net: number
  chfAsset: number
  chfLiability: number
  chfNet: number
}

export interface TokenOverviewClassification {
  classification: TransferClassification
  count: number
  total: number
  chfTotal: number
}

export interface TokenOverviewResponse {
  address: WalletAddress
  tokens: TokenOverviewToken[]
  byClassification: TokenOverviewClassification[]
  unclassifiedCount: number
  years: number[]
}

export type TokenPriceMap = Record<string, string> // tokenSymbol → CHF price string

export type AdjustmentType = 'PROFIT' | 'LOSS' | 'BORROW' | 'REPAYMENT'

export interface Adjustment {
  id: string
  accountingAddressId: string
  date: string
  type: AdjustmentType
  tokenSymbol: string | null
  amount: string | null
  chfValue: string | null
  note: string | null
  createdAt: string
  updatedAt: string
}
