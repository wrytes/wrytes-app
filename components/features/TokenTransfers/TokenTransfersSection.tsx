import { useState, useMemo, useCallback, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faSync,
  faTrash,
  faChevronUp,
  faChevronDown,
  faArrowUpRightFromSquare,
  faExclamationTriangle,
  faBan,
  faCheck,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import { Table, TableBody, TableHead, TableRow, TableRowEmpty } from '@/components/ui/Table';
import { EditableCell } from '@/components/ui/Table/EditableCell';
import { apiRequest } from '@/lib/api/client';
import { formatCurrency, sanitizeNumericInput } from '@/lib/utils/format-handling';
import { CorrectionsTable } from './CorrectionsTable';
import { TransfersTable } from './TransfersTable';
import { TokenLogo } from './TokenLogo';
import { useAddressColors } from '@/hooks/redux/useAddressColors';
import { ADDRESS_COLOR_KEYS, ADDRESS_COLOR_CLASSES } from './addressColors';
import type {
  WalletAddress,
  Transfer,
  TransferWithAddress,
  BlacklistEntry,
  TransferClassification,
  TokenOverviewResponse,
  TokenOverviewClassification,
  MergedTokenOverview,
  TokenPriceBucketMap,
  DailyPriceMap,
  DailyPriceLookup,
  CorrectionPrefill,
} from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUPPORTED_CHAINS = [
  { label: 'Ethereum', value: 'eth-mainnet', chainId: 1 },
  { label: 'Base', value: 'base-mainnet', chainId: 8453 },
  { label: 'Arbitrum', value: 'arb-mainnet', chainId: 42161 },
  { label: 'Optimism', value: 'opt-mainnet', chainId: 10 },
  { label: 'Polygon', value: 'polygon-mainnet', chainId: 137 },
];

const EXPLORER_BASE: Record<number, string> = {
  1: 'https://etherscan.io',
  8453: 'https://basescan.org',
  42161: 'https://arbiscan.io',
  10: 'https://optimistic.etherscan.io',
  137: 'https://polygonscan.com',
};

const CLASSIFICATION_LABEL: Partial<Record<TransferClassification, string>> = {
  UNCLASSIFIED: 'Unclassified',
  NEUTRAL: 'Neutral',
  CAPITAL: 'Capital',
  LOAN: 'Loan',
  INCOME: 'Income',
  EXPENSE: 'Expense',
  SWAP_OUT: 'Swap Out',
  SWAP_IN: 'Swap In',
  PAYMENT: 'Payment',
  RECEIVED: 'Received',
  // legacy
  REPAYMENT: 'Repayment',
};

type ClassStyle = { color: string; bg: string };

const CLASSIFICATION_STYLE: Partial<Record<TransferClassification, ClassStyle>> = {
  CAPITAL: { color: 'text-success', bg: 'bg-success-bg' },
  LOAN: { color: 'text-info', bg: 'bg-info/10' },
  INCOME: { color: 'text-success', bg: 'bg-success-bg' },
  EXPENSE: { color: 'text-error', bg: 'bg-error-bg' },
  SWAP_OUT: { color: 'text-warning', bg: 'bg-warning/10' },
  SWAP_IN: { color: 'text-success', bg: 'bg-success-bg' },
  PAYMENT: { color: 'text-error', bg: 'bg-error-bg' },
  RECEIVED: { color: 'text-success', bg: 'bg-success-bg' },
  NEUTRAL: { color: 'text-text-muted', bg: 'bg-surface' },
  UNCLASSIFIED: { color: 'text-warning', bg: 'bg-warning/10' },
  // legacy
  ASSET: { color: 'text-success', bg: 'bg-success-bg' },
  REPAYMENT: { color: 'text-brand', bg: 'bg-brand/10' },
  LIABILITY: { color: 'text-info', bg: 'bg-info/10' },
  SKIPPED: { color: 'text-text-muted', bg: 'bg-surface' },
};

function getStyle(cls: TransferClassification): ClassStyle {
  return CLASSIFICATION_STYLE[cls] ?? { color: 'text-text-secondary', bg: 'bg-surface' };
}

const QUARTERS = [
  { label: 'Q1', value: 1, months: 'Jan – Mar' },
  { label: 'Q2', value: 2, months: 'Apr – Jun' },
  { label: 'Q3', value: 3, months: 'Jul – Sep' },
  { label: 'Q4', value: 4, months: 'Oct – Dec' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function explorerTxUrl(chainId: number, txHash: string) {
  const base = EXPLORER_BASE[chainId];
  return base ? `${base}/tx/${txHash}` : null;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-CH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function fmtNum(n: number, decimals = 2) {
  return formatCurrency(n, decimals, decimals) ?? '0';
}

function dust(n: number) {
  return Math.abs(n) < 0.01 ? 0 : n;
}

function chfCell(value: number) {
  if (Math.abs(value) < 0.01) return <span className="text-text-muted text-xs">—</span>;
  const pos = value >= 0;
  return (
    <span className={`text-sm font-semibold tabular-nums ${pos ? 'text-success' : 'text-error'}`}>
      {pos ? '+' : ''}CHF {fmtNum(value)}
    </span>
  );
}

function quarterLabel(year: number, quarter: number) {
  return `${QUARTERS[quarter - 1].label} ${year} (${QUARTERS[quarter - 1].months})`;
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

// Bucket 0 = year-end/whole-year price; buckets 1-3 = a Q1-Q3 override (exotic tokens only).
function isYearEndPeriodFor(quarter: number | null) {
  return quarter === null || quarter === 4;
}

function priceBucketFor(quarter: number | null) {
  return isYearEndPeriodFor(quarter) ? 0 : quarter!;
}

// Looks up a manual price bucket; if empty (and not the year-end bucket), carries forward
// the most recent earlier-quarter value in the same year as a suggested default.
function getManualEntry(
  bucketMap: TokenPriceBucketMap,
  sym: string,
  bucket: number
): { value: string | null; isCarriedForward: boolean } {
  const symMap = bucketMap[sym];
  if (!symMap) return { value: null, isCarriedForward: false };
  if (symMap[bucket] !== undefined) return { value: symMap[bucket]!, isCarriedForward: false };
  if (bucket === 0) return { value: null, isCarriedForward: false };
  for (let b = bucket - 1; b >= 1; b--) {
    if (symMap[b] !== undefined) return { value: symMap[b]!, isCarriedForward: true };
  }
  return { value: null, isCarriedForward: false };
}

interface CellPrice {
  price: number | null;
  editable: boolean;
  bucket: number;
  rawValue: string | null;
  isCarriedForward: boolean;
  auto: DailyPriceLookup | null;
}

// Resolves the effective price for one token row, given the current year/quarter selection:
// - no year selected -> nothing to show
// - year-end period (Q4 or whole year) that has already ended -> manual entry (bucket 0), as before
// - a mapped token (has a reference daily-close feed) in any other period -> auto, read-only
// - anything else (exotic token, or daily price not loaded yet) -> manual entry, always editable,
//   carrying forward the last known quarter's value as a suggestion
function computeCellPrice(
  sym: string,
  year: number | null,
  quarter: number | null,
  periodEnded: boolean,
  tokenPrices: TokenPriceBucketMap,
  dailyPrices: DailyPriceMap
): CellPrice {
  if (!year || !sym) {
    return { price: null, editable: false, bucket: 0, rawValue: null, isCarriedForward: false, auto: null };
  }

  if (isYearEndPeriodFor(quarter) && periodEnded) {
    const entry = getManualEntry(tokenPrices, sym, 0);
    return {
      price: entry.value ? parseFloat(entry.value) || null : null,
      editable: true,
      bucket: 0,
      rawValue: entry.value,
      isCarriedForward: false,
      auto: null,
    };
  }

  const daily = dailyPrices[sym];
  if (daily?.mapped) {
    return {
      price: daily.chfClose ?? null,
      editable: false,
      bucket: 0,
      rawValue: null,
      isCarriedForward: false,
      auto: daily,
    };
  }

  const bucket = priceBucketFor(quarter);
  const entry = getManualEntry(tokenPrices, sym, bucket);
  return {
    price: entry.value ? parseFloat(entry.value) || null : null,
    editable: true,
    bucket,
    rawValue: entry.value,
    isCarriedForward: entry.isCarriedForward,
    auto: null,
  };
}

// Aggregate per-address TokenOverviewResponses (one per selected address) into a single
// combined overview — summed per token symbol and per classification.
function mergeOverviews(overviews: TokenOverviewResponse[]): MergedTokenOverview {
  const tokenMap = new Map<string, MergedTokenOverview['tokens'][number]>();
  for (const ov of overviews) {
    for (const t of ov.tokens) {
      const key = t.tokenSymbol ?? t.tokenAddress ?? 'UNKNOWN';
      const existing = tokenMap.get(key);
      if (existing) {
        existing.asset += t.asset;
        existing.liability += t.liability;
        existing.net += t.net;
        existing.chfAsset += t.chfAsset;
        existing.chfLiability += t.chfLiability;
        existing.chfNet += t.chfNet;
      } else {
        tokenMap.set(key, { ...t, chainId: ov.address.chainId });
      }
    }
  }

  const classMap = new Map<TransferClassification, TokenOverviewClassification>();
  for (const ov of overviews) {
    for (const c of ov.byClassification) {
      const existing = classMap.get(c.classification);
      if (existing) {
        existing.count += c.count;
        existing.total += c.total;
        existing.chfTotal += c.chfTotal;
      } else {
        classMap.set(c.classification, { ...c });
      }
    }
  }

  return {
    tokens: [...tokenMap.values()],
    byClassification: [...classMap.values()],
    unclassifiedCount: overviews.reduce((sum, ov) => sum + ov.unclassifiedCount, 0),
    years: [...new Set(overviews.flatMap(ov => ov.years))].sort((a, b) => b - a),
    periodEndDate: overviews[0]?.periodEndDate ?? null,
    periodEnded: overviews[0]?.periodEnded ?? false,
  };
}

// ---------------------------------------------------------------------------
// AddressBar
// ---------------------------------------------------------------------------

function AddressBar({
  addresses,
  selectedIds,
  syncing,
  onAdd,
  onSync,
  onRemove,
  onToggle,
  onUpdateLabel,
}: {
  addresses: WalletAddress[];
  selectedIds: string[];
  syncing: string | null;
  onAdd: (address: string, chain: string, label: string) => Promise<void>;
  onSync: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onToggle: (id: string) => void;
  onUpdateLabel: (id: string, label: string | null) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState('eth-mainnet');
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [labelEditing, setLabelEditing] = useState<{ id: string; value: string } | null>(null);
  const [colorPickerId, setColorPickerId] = useState<string | null>(null);
  const { colorFor, setColor } = useAddressColors();

  const handleAdd = async () => {
    if (!address.trim()) return;
    setAdding(true);
    setError('');
    try {
      await onAdd(address.trim(), chain, newLabel.trim());
      setAddress('');
      setNewLabel('');
      setShowAdd(false);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to add address');
    } finally {
      setAdding(false);
    }
  };

  const handleSaveLabel = async (id: string) => {
    if (!labelEditing) return;
    await onUpdateLabel(id, labelEditing.value.trim() || null);
    setLabelEditing(null);
  };

  return (
    <div className="mb-6 print:hidden">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          <span className="font-semibold uppercase tracking-wider">Tracked Addresses</span>
          {addresses.length > 0 && (
            <span className="bg-surface border border-table-alt rounded px-1.5 py-0.5 tabular-nums">
              {addresses.length}
            </span>
          )}
          <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} className="w-2.5 h-2.5 print:hidden" />
        </button>
        <button
          onClick={() => { setShowAdd(o => !o); setOpen(true); }}
          className="print:hidden flex items-center gap-1.5 text-xs text-brand border border-brand/30 px-3 py-1.5 rounded-lg hover:bg-brand/10 transition-colors"
        >
          <FontAwesomeIcon icon={showAdd ? faChevronUp : faPlus} className="w-3 h-3" />
          {showAdd ? 'Cancel' : 'Add address'}
        </button>
      </div>

      <div className={`bg-card border border-table-alt rounded-lg overflow-hidden ${open ? '' : 'hidden print:block'}`}>
          {addresses.length === 0 && !showAdd ? (
            <p className="text-center text-text-muted text-sm py-4">No addresses tracked yet.</p>
          ) : (
            addresses.map(a => {
              const isSelected = selectedIds.includes(a.id);
              const isEditingLabel = labelEditing?.id === a.id;
              return (
                <div
                  key={a.id}
                  className={`flex items-center gap-3 px-4 py-2.5 border-b border-table-alt/50 last:border-0 cursor-pointer transition-colors ${
                    isSelected ? 'bg-brand/5' : 'hover:bg-surface/50'
                  }`}
                  onClick={() => onToggle(a.id)}
                >
                  <div className={`w-3 h-3 rounded border flex-shrink-0 flex items-center justify-center ${isSelected ? 'bg-brand border-brand' : 'border-table-alt'}`}>
                    {isSelected && <FontAwesomeIcon icon={faCheck} className="w-2 h-2 text-white" />}
                  </div>
                  <div className="relative flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => setColorPickerId(id => (id === a.id ? null : a.id))}
                      className={`w-3.5 h-3.5 rounded-full ${ADDRESS_COLOR_CLASSES[colorFor(a.id)].dot}`}
                      title="Badge color"
                    />
                    {colorPickerId === a.id && (
                      <div className="absolute z-10 top-full left-0 mt-1 flex items-center gap-1.5 bg-card border border-table-alt rounded-lg p-2 shadow-lg">
                        {ADDRESS_COLOR_KEYS.map(key => (
                          <button
                            key={key}
                            onClick={() => { setColor(a.id, key); setColorPickerId(null); }}
                            className={`w-4 h-4 rounded-full ${ADDRESS_COLOR_CLASSES[key].dot} ${colorFor(a.id) === key ? 'ring-2 ring-offset-1 ring-text-secondary' : ''}`}
                            title={key}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                    <EditableCell
                      value={a.label}
                      isEditing={isEditingLabel}
                      editValue={isEditingLabel ? labelEditing!.value : ''}
                      onEdit={() => setLabelEditing({ id: a.id, value: a.label ?? '' })}
                      onSave={() => handleSaveLabel(a.id)}
                      onCancel={() => setLabelEditing(null)}
                      onChange={v => setLabelEditing({ id: a.id, value: v })}
                      emptyText={`${a.address.slice(0, 6)}…${a.address.slice(-4)}`}
                      placeholder="Add label…"
                      align="left"
                    />
                    <p className="text-xs text-text-muted font-mono mt-0.5 truncate">{a.address}</p>
                  </div>
                  <span className="text-xs text-text-muted bg-surface border border-table-alt rounded px-1.5 py-0.5 flex-shrink-0">
                    {a.chain.split('-')[0]}
                  </span>
                  <div className="print:hidden flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => onSync(a.id)}
                      disabled={syncing === a.id}
                      className="text-text-muted hover:text-brand transition-colors p-1 disabled:opacity-50"
                      title="Sync"
                    >
                      <FontAwesomeIcon icon={faSync} className={`w-3 h-3 ${syncing === a.id ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => onRemove(a.id)}
                      className="text-text-muted hover:text-error transition-colors p-1"
                      title="Remove"
                    >
                      <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}

          {showAdd && (
            <div className="print:hidden px-4 py-3 border-t border-table-alt bg-surface/30 space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  placeholder="0x…"
                  className="flex-1 bg-transparent border border-table-alt rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand"
                />
                <select
                  value={chain}
                  onChange={e => setChain(e.target.value)}
                  className="bg-card border border-table-alt rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
                >
                  {SUPPORTED_CHAINS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  placeholder="Label (optional)"
                  className="w-36 bg-transparent border border-table-alt rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand"
                />
                <button
                  onClick={handleAdd}
                  disabled={adding || !address.trim()}
                  className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 disabled:opacity-50 transition-colors"
                >
                  <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                  Add
                </button>
              </div>
              {error && <p className="text-error text-xs">{error}</p>}
            </div>
          )}
        </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BlacklistPanel
// ---------------------------------------------------------------------------

function BlacklistPanel({
  blacklist,
  onRemove,
}: {
  blacklist: BlacklistEntry[];
  onRemove: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-6 print:hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-xs text-text-muted hover:text-text-secondary transition-colors"
      >
        <span className="font-semibold uppercase tracking-wider">Blacklisted tokens</span>
        {blacklist.length > 0 && (
          <span className="bg-surface border border-table-alt rounded px-1.5 py-0.5 tabular-nums">
            {blacklist.length}
          </span>
        )}
        <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} className="w-2.5 h-2.5 print:hidden" />
      </button>

      <div className={`mt-3 bg-card border border-table-alt rounded-lg overflow-hidden ${open ? '' : 'hidden print:block'}`}>
          {blacklist.length === 0 ? (
            <p className="text-center text-text-muted text-sm py-4">No tokens blacklisted.</p>
          ) : (
            blacklist.map(entry => (
              <div
                key={entry.id}
                className="flex items-center gap-3 px-4 py-2.5 border-b border-table-alt/50 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-text-primary">
                    {entry.tokenSymbol ?? 'Unknown'}
                  </span>
                  <span className="ml-2 text-xs text-text-muted font-mono truncate">
                    {entry.tokenAddress.slice(0, 8)}…{entry.tokenAddress.slice(-6)}
                  </span>
                </div>
                <button
                  onClick={() => onRemove(entry.id)}
                  className="print:hidden text-text-muted hover:text-error transition-colors p-1 shrink-0"
                  title="Remove from blacklist"
                >
                  <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TokenOverviewSection
// ---------------------------------------------------------------------------

function getTokenOverviewHeaders(isYearEndPeriod: boolean): string[] {
  return [
    'Token',
    'Asset',
    'Liability',
    'Net',
    isYearEndPeriod ? 'Year End Price' : 'Token Price',
    'Accounted',
    'Unrealized P/L',
  ];
}

type PriceMap = Record<string, { chf: number | null }>;

function TokenOverviewSection({
  overview,
  prices: _prices,
  tokenPrices,
  dailyPrices,
  year,
  quarter,
  onBlacklist,
  onAddCorrection,
  onSaveTokenPrice,
}: {
  overview: MergedTokenOverview | null;
  prices: PriceMap;
  tokenPrices: TokenPriceBucketMap;
  dailyPrices: DailyPriceMap;
  year: number | null;
  quarter: number | null;
  onBlacklist: (tokenAddress: string, chainId: number, tokenSymbol: string | null) => Promise<void>;
  onAddCorrection: (prefill: CorrectionPrefill) => void;
  onSaveTokenPrice: (tokenSymbol: string, quarter: number, priceChf: string | null) => Promise<void>;
}) {
  const [priceEditing, setPriceEditing] = useState<{ symbol: string; bucket: number; value: string } | null>(null);

  if (!overview) {
    return (
      <p className="text-center text-text-muted text-sm py-8">
        Sync an address and classify transfers to see the overview.
      </p>
    );
  }

  const { tokens, byClassification } = overview;

  const isYearEndPeriod = isYearEndPeriodFor(quarter);
  const headers = getTokenOverviewHeaders(isYearEndPeriod);

  const visibleTokens = tokens.filter(t => dust(t.net) !== 0 || dust(t.chfNet) !== 0);

  const totals = visibleTokens.reduce(
    (acc, t) => {
      const sym = t.tokenSymbol ?? '';
      const net = dust(t.net);
      const cell = computeCellPrice(sym, year, quarter, overview.periodEnded, tokenPrices, dailyPrices);
      const unrealized = cell.price !== null ? net * cell.price - t.chfNet : null;
      return {
        accounted: acc.accounted + t.chfNet,
        unrealized: unrealized !== null ? (acc.unrealized ?? 0) + unrealized : acc.unrealized,
      };
    },
    { accounted: 0, unrealized: null as number | null }
  );

  return (
    <div className="space-y-6 mb-8">
      {byClassification.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            By Classification
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {(['CAPITAL', 'LOAN', 'INCOME', 'EXPENSE', 'SWAP_OUT', 'SWAP_IN', 'PAYMENT', 'RECEIVED'] as TransferClassification[])
              .map(cls => byClassification.find(b => b.classification === cls))
              .filter((item): item is NonNullable<typeof item> => !!item)
              .map(item => {
              const style = getStyle(item.classification);
              const label = CLASSIFICATION_LABEL[item.classification] ?? item.classification;
              return (
                <div
                  key={item.classification}
                  className="rounded-lg px-4 py-3 border border-table-alt bg-card space-y-1"
                >
                  <div className={`text-xs font-semibold ${style.color}`}>{label}</div>
                  <div className="text-sm font-bold text-text-primary tabular-nums">
                    {Math.abs(item.chfTotal) >= 0.01 ? `CHF ${fmtNum(Math.abs(item.chfTotal))}` : '—'}
                  </div>
                  <div className="text-xs text-text-muted tabular-nums">
                    {item.count} transfer{item.count !== 1 ? 's' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tokens.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            Token Balances
          </h3>

          <Table>
              <TableHead headers={headers} colSpan={headers.length} />
              <TableBody>
                {((): React.ReactElement[] => {
                  const rows: React.ReactElement[] = visibleTokens.map(t => {
                    const key = t.tokenAddress ?? t.tokenSymbol ?? 'UNKNOWN';
                    const sym = t.tokenSymbol ?? '';
                    const net = dust(t.net);
                    const asset = dust(t.asset);
                    const liability = dust(t.liability);
                    const cell = computeCellPrice(sym, year, quarter, overview.periodEnded, tokenPrices, dailyPrices);
                    const unrealized = cell.price !== null ? net * cell.price - t.chfNet : null;
                    const isEditingPrice = priceEditing?.symbol === sym && priceEditing.bucket === cell.bucket;

                    return (
                      <TableRow key={key} headers={headers} colSpan={headers.length}>
                        <div className="group flex items-center gap-2 text-left">
                          <TokenLogo symbol={t.tokenSymbol} />
                          <span className="font-semibold text-sm text-text-primary">{t.tokenSymbol ?? 'Unknown'}</span>
                          <button onClick={() => onAddCorrection({ tokenSymbol: t.tokenSymbol })} className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-brand p-0.5" title="Add manual correction">
                            <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                          </button>
                          {t.tokenAddress && (
                            <button onClick={() => onBlacklist(t.tokenAddress!, t.chainId, t.tokenSymbol)} className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-error p-0.5" title="Blacklist token">
                              <FontAwesomeIcon icon={faBan} className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div className={`text-sm tabular-nums font-medium ${asset === 0 ? 'text-text-muted' : asset > 0 ? 'text-success' : 'text-error'}`}>
                          {asset === 0 ? '—' : `${asset > 0 ? '+' : ''}${fmtNum(asset, 4)}`}
                        </div>
                        <div className={`text-sm tabular-nums font-medium ${liability === 0 ? 'text-text-muted' : 'text-error'}`}>
                          {liability === 0 ? '—' : fmtNum(liability, 4)}
                        </div>
                        <div className={`text-sm tabular-nums font-bold ${net === 0 ? 'text-text-muted' : net > 0 ? 'text-success' : 'text-error'}`}>
                          {net === 0 ? '—' : `${net > 0 ? '+' : ''}${fmtNum(net, 4)}`}
                        </div>
                        <div onClick={e => e.stopPropagation()}>
                          {!year ? (
                            <span className="text-text-muted text-xs">select year</span>
                          ) : cell.editable ? (
                            <EditableCell
                              value={cell.rawValue ? `CHF ${fmtNum(parseFloat(cell.rawValue))}` : null}
                              isEditing={isEditingPrice}
                              editValue={isEditingPrice ? priceEditing!.value : ''}
                              onEdit={() => setPriceEditing({ symbol: sym, bucket: cell.bucket, value: cell.rawValue ?? '' })}
                              onSave={async () => { if (!priceEditing) return; await onSaveTokenPrice(sym, priceEditing.bucket, sanitizeNumericInput(priceEditing.value.trim()) || null); setPriceEditing(null); }}
                              onCancel={() => setPriceEditing(null)}
                              onChange={v => setPriceEditing({ symbol: sym, bucket: cell.bucket, value: v })}
                              placeholder="0.00"
                              emptyText="Set price"
                              isEstimate={cell.isCarriedForward}
                              estimateTooltip="Carried forward from an earlier quarter — click to confirm or change"
                            />
                          ) : (
                            <span
                              className="text-text-muted text-xs"
                              title={
                                cell.auto?.chfClose != null
                                  ? `${cell.auto.source ?? 'auto'} close, ${cell.auto.date ?? ''}`
                                  : 'No daily price available yet'
                              }
                            >
                              {cell.price != null ? `CHF ${fmtNum(cell.price)}` : '—'}
                            </span>
                          )}
                        </div>
                        <div className="text-right">{chfCell(t.chfNet)}</div>
                        <div className="group flex items-center justify-end gap-1.5">
                          {unrealized === null || Math.abs(unrealized) < 0.01 ? (
                            <span className="text-text-muted text-xs">—</span>
                          ) : (
                            <>
                              <button
                                onClick={() => onAddCorrection({
                                  tokenSymbol: t.tokenSymbol,
                                  type: unrealized >= 0 ? 'PROFIT' : 'LOSS',
                                  chfValue: String(Math.abs(unrealized)),
                                  note: 'Settlement: Unrealized P/L',
                                })}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-brand p-0.5"
                                title="Settle unrealized P/L into a manual entry"
                              >
                                <FontAwesomeIcon icon={faCircleCheck} className="w-3 h-3" />
                              </button>
                              <span className={`text-sm tabular-nums font-medium ${unrealized >= 0 ? 'text-success' : 'text-error'}`}>
                                {unrealized >= 0 ? '+' : ''}CHF {fmtNum(unrealized)}
                              </span>
                            </>
                          )}
                        </div>
                      </TableRow>
                    );
                  });
                  rows.push(
                    <TableRow key="__total" headers={headers} colSpan={headers.length}>
                      <div className="text-left font-bold text-text-primary text-sm">Total</div>
                      <div />
                      <div />
                      <div />
                      <div />
                      <div className={`text-right font-bold text-sm tabular-nums ${Math.abs(totals.accounted) < 0.01 ? 'text-text-muted' : totals.accounted >= 0 ? 'text-success' : 'text-error'}`}>
                        {Math.abs(totals.accounted) < 0.01 ? '—' : `${totals.accounted >= 0 ? '+' : ''}CHF ${fmtNum(totals.accounted)}`}
                      </div>
                      <div className="text-right">
                        {totals.unrealized === null || Math.abs(totals.unrealized) < 0.01 ? (
                          <span className="text-text-muted text-xs">—</span>
                        ) : (
                          <span className={`text-sm tabular-nums font-bold ${totals.unrealized >= 0 ? 'text-success' : 'text-error'}`}>
                            {totals.unrealized >= 0 ? '+' : ''}CHF {fmtNum(totals.unrealized)}
                          </span>
                        )}
                      </div>
                    </TableRow>
                  );
                  return rows;
                })()}
              </TableBody>
            </Table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const TRANSFER_HEADERS = ['Date', 'Token', 'Amount', 'CHF', 'Classification'];

export function TokenTransfersSection() {
  const [addresses, setAddresses] = useState<WalletAddress[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [transfers, setTransfers] = useState<TransferWithAddress[]>([]);
  const [total, setTotal] = useState(0);
  const [overview, setOverview] = useState<MergedTokenOverview | null>(null);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [prices, setPrices] = useState<PriceMap>({});
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(() => new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState<number | null>(
    () => Math.ceil((new Date().getMonth() + 1) / 3)
  );
  const [correctionPrefill, setCorrectionPrefill] = useState<CorrectionPrefill | null>(null);
  const [tokenPrices, setTokenPrices] = useState<TokenPriceBucketMap>({});
  const [dailyPrices, setDailyPrices] = useState<DailyPriceMap>({});

  useEffect(() => {
    void loadAddresses();
    void apiRequest<PriceMap>('/prices')
      .then(setPrices)
      .catch(() => {});
    void apiRequest<BlacklistEntry[]>('/accounting/blacklist')
      .then(setBlacklist)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAddresses = useCallback(async () => {
    const data = await apiRequest<WalletAddress[]>('/accounting/addresses');
    setAddresses(data);
    if (data.length > 0) {
      const all = data.map(a => a.id);
      setSelectedIds(prev => {
        const ids = prev.length > 0 ? prev : all;
        void loadTransfers(ids, data);
        void loadOverview(ids, selectedYear, selectedQuarter);
        return ids;
      });
    }
  }, []);

  const loadTransfers = useCallback(async (ids: string[], addressList?: WalletAddress[]) => {
    if (ids.length === 0) {
      setTransfers([]);
      setTotal(0);
      return;
    }
    setLoadingTransfers(true);
    try {
      const results = await Promise.all(
        ids.map(id =>
          apiRequest<{ total: number; transfers: Transfer[] }>(
            `/accounting/addresses/${id}/transfers?take=500`
          )
        )
      );
      const list = addressList ?? addresses;
      const merged: TransferWithAddress[] = [];
      let totalCount = 0;
      results.forEach((data, i) => {
        const id = ids[i];
        const chainId = list.find(a => a.id === id)?.chainId ?? 1;
        totalCount += data.total;
        data.transfers.forEach(t => merged.push({ ...t, addressId: id, chainId }));
      });
      setTransfers(merged);
      setTotal(totalCount);
    } finally {
      setLoadingTransfers(false);
    }
  }, [addresses]);

  const loadTokenPrices = useCallback(async (ids: string[], year: number) => {
    if (ids.length === 0) {
      setTokenPrices({});
      return;
    }
    const results = await Promise.all(
      ids.map(id =>
        apiRequest<{ tokenSymbol: string; quarter: number; priceChf: string }[]>(
          `/accounting/addresses/${id}/token-prices?year=${year}`
        )
      )
    );
    // Primary (first-selected) address wins on conflicts.
    const merged: TokenPriceBucketMap = {};
    for (let i = results.length - 1; i >= 0; i--) {
      for (const row of results[i]) {
        merged[row.tokenSymbol] = { ...merged[row.tokenSymbol], [row.quarter]: row.priceChf };
      }
    }
    setTokenPrices(merged);
  }, []);

  const handleSaveTokenPrice = useCallback(
    async (tokenSymbol: string, quarter: number, priceChf: string | null) => {
      const primaryId = selectedIds[0];
      if (!primaryId || !selectedYear) return;
      await apiRequest(`/accounting/addresses/${primaryId}/token-prices`, {
        method: 'POST',
        body: JSON.stringify({ year: selectedYear, quarter, tokenSymbol, priceChf }),
      });
      setTokenPrices(prev => {
        const nextSymMap = { ...prev[tokenSymbol] };
        if (!priceChf) delete nextSymMap[quarter];
        else nextSymMap[quarter] = priceChf;
        return { ...prev, [tokenSymbol]: nextSymMap };
      });
    },
    [selectedIds, selectedYear]
  );

  // Auto-fetch a reference daily/quarter-end price for mapped tokens whenever we're not
  // in the manual year-end editing state (see computeCellPrice for the full decision tree).
  useEffect(() => {
    let cancelled = false;
    if (!overview || !selectedYear) {
      setDailyPrices({});
      return;
    }
    if (isYearEndPeriodFor(selectedQuarter) && overview.periodEnded) {
      setDailyPrices({});
      return;
    }

    const date = overview.periodEnded ? overview.periodEndDate! : todayDateString();
    const symbols = [...new Set(overview.tokens.map(t => t.tokenSymbol).filter((s): s is string => !!s))];
    if (symbols.length === 0) {
      setDailyPrices({});
      return;
    }

    void Promise.all(
      symbols.map(async sym => {
        try {
          const result = await apiRequest<DailyPriceLookup>(
            `/prices/daily?symbol=${encodeURIComponent(sym)}&date=${date}`
          );
          return [sym, result] as const;
        } catch {
          return [sym, { mapped: true }] as const;
        }
      })
    ).then(entries => {
      if (cancelled) return;
      setDailyPrices(Object.fromEntries(entries));
    });

    return () => {
      cancelled = true;
    };
  }, [overview, selectedYear, selectedQuarter]);

  const loadOverview = useCallback(
    async (ids: string[], year?: number | null, quarter?: number | null) => {
      if (ids.length === 0) {
        setOverview(null);
        return;
      }
      const qs = new URLSearchParams();
      if (year) qs.set('year', String(year));
      if (quarter) qs.set('quarter', String(quarter));
      const suffix = qs.toString() ? '?' + qs : '';
      const results = await Promise.all(
        ids.map(id => apiRequest<TokenOverviewResponse>(`/accounting/addresses/${id}/token-overview${suffix}`))
      );
      setOverview(mergeOverviews(results));
    },
    []
  );

  const handleAddAddress = async (address: string, chain: string, label: string) => {
    await apiRequest('/accounting/addresses', {
      method: 'POST',
      body: JSON.stringify({ address, chain, label: label || undefined }),
    });
    await loadAddresses();
  };

  const handleSync = async (id: string) => {
    setSyncing(id);
    try {
      await apiRequest(`/accounting/addresses/${id}/sync`, { method: 'POST' });
      await Promise.all([loadTransfers(selectedIds), loadOverview(selectedIds, selectedYear, selectedQuarter)]);
      setAddresses(prev =>
        prev.map(a => (a.id === id ? { ...a, lastSyncedAt: new Date().toISOString() } : a))
      );
    } finally {
      setSyncing(null);
    }
  };

  const handleRemoveAddress = async (id: string) => {
    await apiRequest(`/accounting/addresses/${id}`, { method: 'DELETE' });
    setAddresses(prev => prev.filter(a => a.id !== id));
    if (selectedIds.includes(id)) {
      const next = selectedIds.filter(x => x !== id);
      setSelectedIds(next);
      void loadTransfers(next);
      void loadOverview(next, selectedYear, selectedQuarter);
    }
  };

  const handleUpdateAddressLabel = async (id: string, label: string | null) => {
    const updated = await apiRequest<WalletAddress>(`/accounting/addresses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ label }),
    });
    setAddresses(prev => prev.map(a => (a.id === id ? updated : a)));
  };

  const handleToggleAddress = (id: string) => {
    setSelectedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      void loadTransfers(next);
      void loadOverview(next, selectedYear, selectedQuarter);
      if (selectedYear) void loadTokenPrices(next, selectedYear);
      return next;
    });
  };

  const handleYearChange = (year: number | null) => {
    setSelectedYear(year);
    setSelectedQuarter(null);
    if (selectedIds.length > 0) {
      void loadOverview(selectedIds, year, null);
      if (year) void loadTokenPrices(selectedIds, year);
      else setTokenPrices({});
    }
  };

  const handleQuarterChange = (quarter: number | null) => {
    setSelectedQuarter(quarter);
    if (selectedIds.length > 0) void loadOverview(selectedIds, selectedYear, quarter);
  };

  const handleUpdateTransfer = useCallback(
    async (id: string, patch: { classification?: string; chfValue?: string | null }) => {
      const updated = await apiRequest<Transfer>(`/accounting/transfers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setTransfers(prev => prev.map(t => (t.id === id ? { ...t, ...updated } : t)));
      if (selectedIds.length > 0) void loadOverview(selectedIds, selectedYear, selectedQuarter);
    },
    [selectedIds, selectedYear, selectedQuarter, loadOverview]
  );

  const handleBlacklist = useCallback(
    async (tokenAddress: string, chainId: number, tokenSymbol: string | null) => {
      await apiRequest('/accounting/blacklist', {
        method: 'POST',
        body: JSON.stringify({ tokenAddress, chainId, tokenSymbol }),
      });
      const [bl] = await Promise.all([
        apiRequest<BlacklistEntry[]>('/accounting/blacklist'),
        loadTransfers(selectedIds),
        loadOverview(selectedIds, selectedYear, selectedQuarter),
      ]);
      setBlacklist(bl);
    },
    [selectedIds, selectedYear, selectedQuarter, loadTransfers, loadOverview]
  );

  const handleUnblacklist = useCallback(
    async (id: string) => {
      await apiRequest(`/accounting/blacklist/${id}`, { method: 'DELETE' });
      setBlacklist(prev => prev.filter(e => e.id !== id));
      if (selectedIds.length > 0) {
        await Promise.all([
          loadTransfers(selectedIds),
          loadOverview(selectedIds, selectedYear, selectedQuarter),
        ]);
      }
    },
    [selectedIds, selectedYear, selectedQuarter, loadTransfers, loadOverview]
  );

  const selectedAddresses = useMemo(
    () => addresses.filter(a => selectedIds.includes(a.id)),
    [addresses, selectedIds]
  );


  const blacklistedAddresses = useMemo(
    () => new Set(blacklist.map(e => e.tokenAddress.toLowerCase())),
    [blacklist]
  );

  const visible = useMemo(() => {
    return transfers.filter(t => {
      if (t.isHidden) return false;
      if (t.tokenAddress && blacklistedAddresses.has(t.tokenAddress.toLowerCase())) return false;
      if (t.timestamp) {
        const d = new Date(t.timestamp);
        // Filter transfer table to the exact selected period
        if (selectedYear) {
          const startMonth = selectedQuarter ? (selectedQuarter - 1) * 3 + 1 : 1;
          const endMonth = selectedQuarter ? selectedQuarter * 3 + 1 : 13;
          const start = new Date(`${selectedYear}-${String(startMonth).padStart(2, '0')}-01T00:00:00.000Z`);
          const end = endMonth > 12
            ? new Date(`${selectedYear + 1}-01-01T00:00:00.000Z`)
            : new Date(`${selectedYear}-${String(endMonth).padStart(2, '0')}-01T00:00:00.000Z`);
          if (d < start || d >= end) return false;
        }
      }
      return true;
    });
  }, [transfers, blacklistedAddresses, selectedYear, selectedQuarter]);

  const availableYears = useMemo(() => {
    if (overview?.years?.length) return overview.years;
    const years = new Set(
      transfers.map(t => (t.timestamp ? new Date(t.timestamp).getFullYear() : null)).filter(Boolean)
    );
    return [...years].sort((a, b) => (b as number) - (a as number)) as number[];
  }, [overview, transfers]);

  return (
    <div>
      <AddressBar
        addresses={addresses}
        selectedIds={selectedIds}
        syncing={syncing}
        onAdd={handleAddAddress}
        onSync={handleSync}
        onRemove={handleRemoveAddress}
        onToggle={handleToggleAddress}
        onUpdateLabel={handleUpdateAddressLabel}
      />
      <BlacklistPanel blacklist={blacklist} onRemove={handleUnblacklist} />
      {/* ------------------------------------------------------------------ */}
      {/* Year + Quarter filter + Print button                                */}
      {/* ------------------------------------------------------------------ */}
      {availableYears.length > 0 && (
        <div className="flex items-start gap-4 mb-6 flex-wrap print:hidden">
          {/* Year */}
          <div className="space-y-1.5">
            <p className="text-xs text-text-muted font-medium">Year</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {availableYears.map(y => (
                <button
                  key={y}
                  onClick={() => handleYearChange(selectedYear === y ? null : y)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    selectedYear === y
                      ? 'bg-brand text-white'
                      : 'bg-card border border-table-alt text-text-secondary hover:text-brand'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* Quarter — only when a year is selected */}
          {selectedYear && (
            <div className="space-y-1.5">
              <p className="text-xs text-text-muted font-medium">Quarter</p>
              <div className="flex items-center gap-1.5">
                {QUARTERS.map(q => (
                  <button
                    key={q.value}
                    onClick={() =>
                      handleQuarterChange(selectedQuarter === q.value ? null : q.value)
                    }
                    title={q.months}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      selectedQuarter === q.value
                        ? 'bg-brand text-white'
                        : 'bg-card border border-table-alt text-text-secondary hover:text-brand'
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />
        </div>
      )}
      {/* ------------------------------------------------------------------ */}
      {/* Printable region — starts here (after address bar, blacklist,      */}
      {/* year/quarter filter). Use the browser's native print (⌘P/Ctrl+P)   */}
      {/* — @media print rules in globals.css make it look right.           */}
      {/* ------------------------------------------------------------------ */}
      <div>
        {/* Print-only header */}
        <div className="hidden print:block mb-6">
          <h1 className="text-xl font-bold text-text-primary">Token Transfer Report</h1>
          {selectedYear && (
            <p className="text-sm text-text-muted">
              Period:{' '}
              {selectedQuarter
                ? quarterLabel(selectedYear, selectedQuarter)
                : `Full year ${selectedYear}`}
            </p>
          )}

          {selectedAddresses.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Tracked Addresses</p>
              {selectedAddresses.map(a => (
                <div key={a.id} className="space-y-0.5">
                  {a.label && <p className="text-sm font-medium text-text-secondary">{a.label}</p>}
                  <p className="text-xs text-text-muted font-mono">{a.address}</p>
                  <p className="text-xs text-text-muted">{a.chain}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overview */}
        <TokenOverviewSection
          overview={overview}
          prices={prices}
          tokenPrices={tokenPrices}
          dailyPrices={dailyPrices}
          year={selectedYear}
          quarter={selectedQuarter}
          onBlacklist={handleBlacklist}
          onAddCorrection={prefill => setCorrectionPrefill(prefill)}
          onSaveTokenPrice={handleSaveTokenPrice}
        />

        {/* Transfer list */}
        {selectedIds.length > 0 && (
          <>
            {/* Corrections / manual entries */}
            <CorrectionsTable
              addressIds={selectedIds}
              addresses={selectedAddresses}
              year={selectedYear}
              quarter={selectedQuarter}
              prefill={correctionPrefill}
              onPrefillConsumed={() => setCorrectionPrefill(null)}
              onMutate={() => void loadOverview(selectedIds, selectedYear, selectedQuarter)}
            />

            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 mt-8">
              Token Transfers
            </h3>

            <TransfersTable
              transfers={visible}
              addresses={selectedAddresses}
              loading={loadingTransfers}
              onUpdate={handleUpdateTransfer}
            />
          </>
        )}

        {/* Print-only legend */}
        <div className="hidden print:block mt-8 pt-3 border-t border-table-alt space-y-1 text-xs text-text-muted">
          <p className="font-semibold uppercase tracking-wider">Legend</p>
          <p>Colored pill below a date — the tracked address that row belongs to.</p>
          <p><span className="italic">Gray italic</span> CHF value — calculated value from fetched daily price.</p>
          <p><span className="text-success">Green</span> / <span className="text-error">Red</span> CHF value — manually entered value.</p>
        </div>
      </div>{' '}
      {/* end printable region */}
    </div>
  );
}
