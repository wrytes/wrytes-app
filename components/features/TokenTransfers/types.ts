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
}

// Client-side aggregation of TokenOverviewResponse across multiple selected addresses
export interface MergedTokenOverview {
  tokens: (TokenOverviewToken & { chainId: number })[]
  byClassification: TokenOverviewClassification[]
  unclassifiedCount: number
  years: number[]
}

export type TokenPriceMap = Record<string, string>          // tokenSymbol → CHF price string
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
