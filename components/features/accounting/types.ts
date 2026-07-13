export interface AccountingAddress {
  id: string
  userId: string
  address: string
  label: string | null
  chain: string
  chainId: number
  lastSyncedAt: string | null
  createdAt: string
  updatedAt: string
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

export interface AccountingTransfer {
  id: string
  accountingAddressId: string
  chainId: number
  txHash: string
  alchemyUniqueId: string
  blockNum: string
  blockNumber: number | null
  logIndex: number | null
  timestamp: string | null
  direction: 'IN' | 'OUT'
  tokenAddress: string | null
  tokenSymbol: string | null
  tokenDecimals: number | null
  tokenType: string
  amountRaw: string | null
  amountFormatted: string | null
  fromAddress: string
  toAddress: string | null
  classification: TransferClassification
  isHidden: boolean
  chfValue: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface TransfersResponse {
  total: number
  transfers: AccountingTransfer[]
}

export interface AccountingBlacklistEntry {
  id: string
  tokenAddress: string
  chainId: number
  tokenSymbol: string | null
  reason: string | null
  addedByUserId: string
  createdAt: string
}

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'
export type NormalBalance = 'DEBIT' | 'CREDIT'
export type JournalLineType = 'DEBIT' | 'CREDIT'

export interface AccountingAccount {
  id: string
  userId: string
  name: string
  code: string | null
  type: AccountType
  normalBalance: NormalBalance
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface JournalLine {
  id: string
  journalEntryId: string
  accountId: string
  account: AccountingAccount
  type: JournalLineType
  amount: string
  chfAmount: string | null
  tokenSymbol: string | null
  createdAt: string
}

export interface JournalEntry {
  id: string
  transferId: string
  date: string
  description: string | null
  createdAt: string
  updatedAt: string
  lines: JournalLine[]
  transfer: {
    tokenSymbol: string | null
    direction: string
    txHash: string
    classification: TransferClassification
  }
}

export interface ClassificationTemplate {
  classification: TransferClassification
  direction: string
  debitAccountId: string | undefined
  creditAccountId: string | undefined
  debitAccountName: string | undefined
  creditAccountName: string | undefined
  isOverridden: boolean
  id: string | undefined
}

export interface TrialBalanceLine extends AccountingAccount {
  debit: number
  credit: number
  chfDebit: number
  chfCredit: number
  net: number
  chfNet: number
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
  address: AccountingAddress
  tokens: TokenOverviewToken[]
  byClassification: TokenOverviewClassification[]
  unclassifiedCount: number
  years: number[]
}

// Legacy — kept for backwards compat with old summary endpoint
export interface TokenSummary {
  tokenSymbol: string | null
  tokenAddress: string | null
  asset: number
  liability: number
  skipped: number
  chfAsset: number
  chfLiability: number
}

export interface SummaryResponse {
  address: AccountingAddress
  trialBalance: TrialBalanceLine[]
}
