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
  | 'LOAN'
  | 'INCOME'
  | 'EXPENSE'
  | 'SWAP_OUT'
  | 'SWAP_IN'
  | 'PAYMENT'
  | 'RECEIVED'
  | 'NEUTRAL'
  | 'UNCLASSIFIED'
  // legacy
  | 'ASSET'
  | 'LIABILITY'
  | 'REPAYMENT'
  | 'SKIPPED'

export interface Transfer {
  id: string
  txHash: string
  timestamp: string | null
  blockNumber: number | null
  logIndex: number | null
  direction: 'IN' | 'OUT'
  fromAddress: string
  toAddress: string | null
  tokenAddress: string | null
  tokenSymbol: string | null
  amountFormatted: string | null
  classification: TransferClassification
  isHidden: boolean
  chfValue: string | null
  chfValueIsEstimate: boolean
  notes: string | null
}

// Client-side tag applied when merging transfers fetched from multiple tracked addresses
export interface TransferWithAddress extends Transfer {
  addressId: string
  chainId: number
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
  periodEndDate: string | null
  periodEnded: boolean
}

// Client-side aggregation of TokenOverviewResponse across multiple selected addresses
export interface MergedTokenOverview {
  tokens: (TokenOverviewToken & { chainId: number })[]
  byClassification: TokenOverviewClassification[]
  unclassifiedCount: number
  years: number[]
  periodEndDate: string | null
  periodEnded: boolean
}

// Manual per-token price entries for a year, bucketed by quarter.
// Bucket 0 = year-end/whole-year (today's original behavior); 1-3 = Q1-Q3 override (exotic tokens only).
export type TokenPriceBucketMap = Record<string /* tokenSymbol */, Partial<Record<number, string>>>

export interface DailyPriceLookup {
  mapped: boolean
  base?: string
  date?: string
  chfClose?: number
  source?: string
}
export type DailyPriceMap = Record<string /* tokenSymbol */, DailyPriceLookup>

export type CounterpartyLabelMap = Record<string, string>   // address (lowercase) → label

export type AdjustmentType = 'PROFIT' | 'LOSS' | 'BORROW' | 'REPAYMENT'

// Pre-fills the manual-entry "Add" form — used by both the plain "Add correction"
// action and the "Settle unrealized P/L" action on the Token Balances table.
export interface CorrectionPrefill {
  tokenSymbol?: string | null
  type?: AdjustmentType
  chfValue?: string
  note?: string
}

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
