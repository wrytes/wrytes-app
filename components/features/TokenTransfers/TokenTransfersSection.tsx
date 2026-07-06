import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import generatePDF, { Margin } from 'react-to-pdf';
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
  faPrint,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { Table, TableBody, TableHead, TableRow, TableRowEmpty } from '@/components/ui/Table';
import { EditableCell } from '@/components/ui/Table/EditableCell';
import { apiRequest } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format-handling';
import { CorrectionsTable } from './CorrectionsTable';
import { TransfersTable } from './TransfersTable';
import { TokenLogo } from './TokenLogo';
import type {
  WalletAddress,
  Transfer,
  TransferWithAddress,
  BlacklistEntry,
  TransferClassification,
  TokenOverviewResponse,
  TokenOverviewClassification,
  MergedTokenOverview,
  TokenPriceMap,
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

const CLASSIFICATION_OPTIONS: { label: string; value: TransferClassification; hint: string }[] = [
  { label: 'Unclassified', value: 'UNCLASSIFIED', hint: '' },
  { label: 'Neutral', value: 'NEUTRAL', hint: 'no effect — still owned' },
  { label: 'Capital', value: 'CAPITAL', hint: 'asset +' },
  { label: 'Income', value: 'INCOME', hint: 'asset +' },
  { label: 'Swap In', value: 'SWAP_IN', hint: 'asset +' },
  { label: 'Loan', value: 'LOAN', hint: 'asset + / liab +' },
  { label: 'Repayment', value: 'REPAYMENT', hint: 'asset − / liab −' },
  { label: 'Swap Out', value: 'SWAP_OUT', hint: 'asset −' },
  { label: 'Expense', value: 'EXPENSE', hint: 'asset −' },
  { label: 'Payment', value: 'PAYMENT', hint: 'asset −' },
];

const CLASSIFICATION_LABEL: Partial<Record<TransferClassification, string>> = {
  UNCLASSIFIED: 'Unclassified',
  NEUTRAL: 'Neutral',
  CAPITAL: 'Capital',
  INCOME: 'Income',
  LOAN: 'Loan',
  REPAYMENT: 'Repayment',
  SWAP_IN: 'Swap In',
  SWAP_OUT: 'Swap Out',
  EXPENSE: 'Expense',
  PAYMENT: 'Payment',
};

type ClassStyle = { color: string; bg: string };

const CLASSIFICATION_STYLE: Partial<Record<TransferClassification, ClassStyle>> = {
  CAPITAL: { color: 'text-success', bg: 'bg-success-bg' },
  INCOME: { color: 'text-success', bg: 'bg-success-bg' },
  SWAP_IN: { color: 'text-success', bg: 'bg-success-bg' },
  LOAN: { color: 'text-info', bg: 'bg-info/10' },
  REPAYMENT: { color: 'text-brand', bg: 'bg-brand/10' },
  SWAP_OUT: { color: 'text-warning', bg: 'bg-warning/10' },
  EXPENSE: { color: 'text-error', bg: 'bg-error-bg' },
  PAYMENT: { color: 'text-error', bg: 'bg-error-bg' },
  NEUTRAL: { color: 'text-text-muted', bg: 'bg-surface' },
  UNCLASSIFIED: { color: 'text-warning', bg: 'bg-warning/10' },
  // legacy
  ASSET: { color: 'text-success', bg: 'bg-success-bg' },
  RECEIVED: { color: 'text-success', bg: 'bg-success-bg' },
  LIABILITY: { color: 'text-info', bg: 'bg-info/10' },
  TRANSFER: { color: 'text-text-muted', bg: 'bg-surface' },
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
  const [open, setOpen] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState('eth-mainnet');
  const [newLabel, setNewLabel] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [labelEditing, setLabelEditing] = useState<{ id: string; value: string } | null>(null);

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
          <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} className="w-2.5 h-2.5" />
        </button>
        <button
          onClick={() => { setShowAdd(o => !o); setOpen(true); }}
          className="flex items-center gap-1.5 text-xs text-brand border border-brand/30 px-3 py-1.5 rounded-lg hover:bg-brand/10 transition-colors"
        >
          <FontAwesomeIcon icon={showAdd ? faChevronUp : faPlus} className="w-3 h-3" />
          {showAdd ? 'Cancel' : 'Add address'}
        </button>
      </div>

      {open && (
        <div className="bg-card border border-table-alt rounded-lg overflow-hidden">
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
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
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
            <div className="px-4 py-3 border-t border-table-alt bg-surface/30 space-y-2">
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
      )}
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
        <FontAwesomeIcon icon={faBan} className="w-3 h-3" />
        <span>Blacklisted tokens</span>
        {blacklist.length > 0 && (
          <span className="bg-surface border border-table-alt rounded px-1.5 py-0.5 tabular-nums">
            {blacklist.length}
          </span>
        )}
        <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} className="w-2.5 h-2.5" />
      </button>

      {open && (
        <div className="mt-3 bg-card border border-table-alt rounded-lg overflow-hidden">
          {blacklist.length === 0 ? (
            <p className="text-center text-text-muted text-sm py-4">No tokens blacklisted.</p>
          ) : (
            blacklist.map(entry => (
              <div
                key={entry.id}
                className="flex items-center gap-3 px-4 py-2.5 border-b border-table-alt/50 last:border-0"
              >
                <FontAwesomeIcon icon={faBan} className="w-3 h-3 text-error shrink-0" />
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
                  className="text-text-muted hover:text-error transition-colors p-1 shrink-0"
                  title="Remove from blacklist"
                >
                  <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TokenOverviewSection
// ---------------------------------------------------------------------------

const TOKEN_OVERVIEW_HEADERS = [
  'Token',
  'Asset',
  'Liability',
  'Net',
  'Accounted',
  'Year End Price',
  'Unrealized P/L',
];

type PriceMap = Record<string, { chf: number | null }>;

function TokenOverviewSection({
  overview,
  prices: _prices,
  tokenPrices,
  year,
  isExporting,
  onBlacklist,
  onAddCorrection,
  onSaveTokenPrice,
}: {
  overview: MergedTokenOverview | null;
  prices: PriceMap;
  tokenPrices: TokenPriceMap;
  year: number | null;
  isExporting: boolean;
  onBlacklist: (tokenAddress: string, chainId: number, tokenSymbol: string | null) => Promise<void>;
  onAddCorrection: (tokenSymbol: string | null) => void;
  onSaveTokenPrice: (tokenSymbol: string, priceChf: string | null) => Promise<void>;
}) {
  const [priceEditing, setPriceEditing] = useState<{ symbol: string; value: string } | null>(null);

  if (!overview) {
    return (
      <p className="text-center text-text-muted text-sm py-8">
        Sync an address and classify transfers to see the overview.
      </p>
    );
  }

  const { tokens, byClassification } = overview;

  const visibleTokens = tokens.filter(t => dust(t.net) !== 0 || t.chfNet !== 0);

  const totals = visibleTokens.reduce(
    (acc, t) => {
      const sym = t.tokenSymbol ?? '';
      const net = dust(t.net);
      const enteredPrice = sym ? parseFloat(tokenPrices[sym] ?? '') || null : null;
      const unrealized = enteredPrice !== null ? net * enteredPrice - t.chfNet : null;
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
            {(['CAPITAL', 'LOAN', 'INCOME', 'EXPENSE', 'PAYMENT', 'SWAP_OUT', 'SWAP_IN'] as TransferClassification[])
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

          {isExporting ? (
            /* Native table for PDF — guarantees column alignment */
            <table className="w-full text-sm border-collapse bg-card rounded-lg overflow-hidden">
              <thead>
                <tr className="border-b border-table-alt">
                  {TOKEN_OVERVIEW_HEADERS.map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-3 font-bold text-text-primary ${i === 0 ? 'text-left' : 'text-right'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleTokens.map(t => {
                    const key = t.tokenAddress ?? t.tokenSymbol ?? 'UNKNOWN';
                    const sym = t.tokenSymbol ?? '';
                    const net = dust(t.net);
                    const asset = dust(t.asset);
                    const liability = dust(t.liability);
                    const enteredPrice = sym ? parseFloat(tokenPrices[sym] ?? '') || null : null;
                    const unrealized = enteredPrice !== null ? net * enteredPrice - t.chfNet : null;
                    return (
                      <tr key={key} className="border-b border-table-alt/50 last:border-0">
                        <td className="px-4 py-3 text-left">
                          <div className="flex items-center gap-2">
                            <TokenLogo symbol={t.tokenSymbol} />
                            <span className="font-semibold text-text-primary">{t.tokenSymbol ?? 'Unknown'}</span>
                          </div>
                        </td>
                        <td className={`px-4 py-3 tabular-nums text-right font-medium ${asset === 0 ? 'text-text-muted' : asset > 0 ? 'text-success' : 'text-error'}`}>
                          {asset === 0 ? '—' : `${asset > 0 ? '+' : ''}${fmtNum(asset, 4)}`}
                        </td>
                        <td className={`px-4 py-3 tabular-nums text-right font-medium ${liability === 0 ? 'text-text-muted' : 'text-error'}`}>
                          {liability === 0 ? '—' : fmtNum(liability, 4)}
                        </td>
                        <td className={`px-4 py-3 tabular-nums text-right font-bold ${net === 0 ? 'text-text-muted' : net > 0 ? 'text-success' : 'text-error'}`}>
                          {net === 0 ? '—' : `${net > 0 ? '+' : ''}${fmtNum(net, 4)}`}
                        </td>
                        <td className="px-4 py-3 text-right">{chfCell(t.chfNet)}</td>
                        <td className="px-4 py-3 tabular-nums text-right text-text-secondary">
                          {tokenPrices[sym] ? `CHF ${fmtNum(parseFloat(tokenPrices[sym]))}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {unrealized === null || Math.abs(unrealized) < 0.01 ? (
                            <span className="text-text-muted">—</span>
                          ) : (
                            <span className={`tabular-nums font-medium ${unrealized >= 0 ? 'text-success' : 'text-error'}`}>
                              {unrealized >= 0 ? '+' : ''}CHF {fmtNum(unrealized)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                {/* Totals row */}
                <tr className="border-t-2 border-table-alt">
                  <td className="px-4 py-3 font-bold text-text-primary text-left">Total</td>
                  <td /><td /><td />
                  <td className={`px-4 py-3 tabular-nums text-right font-bold ${Math.abs(totals.accounted) < 0.01 ? 'text-text-muted' : totals.accounted >= 0 ? 'text-success' : 'text-error'}`}>
                    {Math.abs(totals.accounted) < 0.01 ? '—' : `${totals.accounted >= 0 ? '+' : ''}CHF ${fmtNum(totals.accounted)}`}
                  </td>
                  <td />
                  <td className="px-4 py-3 text-right">
                    {totals.unrealized === null || Math.abs(totals.unrealized) < 0.01 ? (
                      <span className="text-text-muted">—</span>
                    ) : (
                      <span className={`tabular-nums font-bold ${totals.unrealized >= 0 ? 'text-success' : 'text-error'}`}>
                        {totals.unrealized >= 0 ? '+' : ''}CHF {fmtNum(totals.unrealized)}
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <Table>
              <TableHead headers={TOKEN_OVERVIEW_HEADERS} colSpan={TOKEN_OVERVIEW_HEADERS.length} />
              <TableBody>
                {((): React.ReactElement[] => {
                  const rows: React.ReactElement[] = visibleTokens.map(t => {
                    const key = t.tokenAddress ?? t.tokenSymbol ?? 'UNKNOWN';
                    const sym = t.tokenSymbol ?? '';
                    const net = dust(t.net);
                    const asset = dust(t.asset);
                    const liability = dust(t.liability);
                    const enteredPrice = sym ? parseFloat(tokenPrices[sym] ?? '') || null : null;
                    const unrealized = enteredPrice !== null ? net * enteredPrice - t.chfNet : null;
                    const isEditingPrice = priceEditing?.symbol === sym;

                    return (
                      <TableRow key={key} headers={TOKEN_OVERVIEW_HEADERS} colSpan={TOKEN_OVERVIEW_HEADERS.length} rawHeader>
                        <div className="group flex items-center gap-2 text-left">
                          <TokenLogo symbol={t.tokenSymbol} />
                          <span className="font-semibold text-sm text-text-primary">{t.tokenSymbol ?? 'Unknown'}</span>
                          <button onClick={() => onAddCorrection(t.tokenSymbol)} className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-brand p-0.5" title="Add manual correction">
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
                        <div className="text-right">{chfCell(t.chfNet)}</div>
                        <div onClick={e => e.stopPropagation()}>
                          {year ? (
                            <EditableCell
                              value={tokenPrices[sym] ? `CHF ${fmtNum(parseFloat(tokenPrices[sym]))}` : null}
                              isEditing={isEditingPrice}
                              editValue={isEditingPrice ? priceEditing!.value : ''}
                              onEdit={() => setPriceEditing({ symbol: sym, value: tokenPrices[sym] ?? '' })}
                              onSave={async () => { if (!priceEditing) return; await onSaveTokenPrice(sym, priceEditing.value.trim() || null); setPriceEditing(null); }}
                              onCancel={() => setPriceEditing(null)}
                              onChange={v => setPriceEditing({ symbol: sym, value: v })}
                              placeholder="0.00"
                              emptyText="Set price"
                            />
                          ) : (
                            <span className="text-text-muted text-xs">select year</span>
                          )}
                        </div>
                        <div className="text-right">
                          {unrealized === null || Math.abs(unrealized) < 0.01 ? (
                            <span className="text-text-muted text-xs">—</span>
                          ) : (
                            <span className={`text-sm tabular-nums font-medium ${unrealized >= 0 ? 'text-success' : 'text-error'}`}>
                              {unrealized >= 0 ? '+' : ''}CHF {fmtNum(unrealized)}
                            </span>
                          )}
                        </div>
                      </TableRow>
                    );
                  });
                  rows.push(
                    <TableRow key="__total" headers={TOKEN_OVERVIEW_HEADERS} colSpan={TOKEN_OVERVIEW_HEADERS.length} rawHeader>
                      <div className="text-left font-bold text-text-primary text-sm">Total</div>
                      <div />
                      <div />
                      <div />
                      <div className={`text-right font-bold text-sm tabular-nums ${Math.abs(totals.accounted) < 0.01 ? 'text-text-muted' : totals.accounted >= 0 ? 'text-success' : 'text-error'}`}>
                        {Math.abs(totals.accounted) < 0.01 ? '—' : `${totals.accounted >= 0 ? '+' : ''}CHF ${fmtNum(totals.accounted)}`}
                      </div>
                      <div />
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
          )}
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
  const [prefillToken, setPrefillToken] = useState<string | null>(null);
  const [tokenPrices, setTokenPrices] = useState<TokenPriceMap>({});
  const [isExporting, setIsExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

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
      const first = data[0].id;
      setSelectedIds(prev => {
        const ids = prev.length > 0 ? prev : [first];
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
    const maps = await Promise.all(
      ids.map(id => apiRequest<TokenPriceMap>(`/accounting/addresses/${id}/token-prices?year=${year}`))
    );
    // Primary (first-selected) address wins on conflicts.
    const merged: TokenPriceMap = {};
    for (let i = maps.length - 1; i >= 0; i--) Object.assign(merged, maps[i]);
    setTokenPrices(merged);
  }, []);

  const handleSaveTokenPrice = useCallback(
    async (tokenSymbol: string, priceChf: string | null) => {
      const primaryId = selectedIds[0];
      if (!primaryId || !selectedYear) return;
      await apiRequest(`/accounting/addresses/${primaryId}/token-prices`, {
        method: 'POST',
        body: JSON.stringify({ year: selectedYear, tokenSymbol, priceChf }),
      });
      setTokenPrices(prev => {
        if (!priceChf) {
          const next = { ...prev };
          delete next[tokenSymbol];
          return next;
        }
        return { ...prev, [tokenSymbol]: priceChf };
      });
    },
    [selectedIds, selectedYear]
  );

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

  useEffect(() => {
    if (!isExporting) return;
    const label =
      selectedAddresses.map(a => a.label ?? a.address.slice(0, 10)).join('_') || 'report';
    const period = selectedYear
      ? selectedQuarter
        ? `${QUARTERS[selectedQuarter - 1].label}${selectedYear}`
        : `${selectedYear}`
      : 'all';

    // Wait for freshly-mounted images (token logos) to load before capturing.
    // html2canvas fires synchronously so images must already be in the DOM.
    const waitForImages = (root: HTMLElement) =>
      Promise.all(
        Array.from(root.querySelectorAll('img')).map(
          img =>
            img.complete
              ? Promise.resolve()
              : new Promise<void>(res => {
                  img.onload = () => res();
                  img.onerror = () => res(); // resolve even on error — fallback will render
                })
        )
      );

    const el = printRef.current;
    const run = async () => {
      if (el) await waitForImages(el);

      const pxToMm = 0.264583;
    const widthMm = el ? el.scrollWidth * pxToMm : 210;
    const heightMm = el ? el.scrollHeight * pxToMm : 297;
    generatePDF(printRef, {
      filename: `token-transfers-${label}-${period}.pdf`,
      page: { margin: Margin.SMALL, format: [widthMm, heightMm] },
      overrides: { canvas: { useCORS: true, allowTaint: false, logging: false } },
    });
    setIsExporting(false);
    };
    void run();
  }, [isExporting]);

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

          {/* Spacer + print */}
          <div className="flex-1" />
          {selectedYear && (
            <div className="self-end">
              <button
                onClick={() => setIsExporting(true)}
                disabled={isExporting}
                className="flex items-center gap-2 text-sm border border-table-alt px-3 py-1.5 rounded-lg text-text-secondary hover:text-brand hover:border-brand transition-colors disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faPrint} className="w-3.5 h-3.5" />
                {isExporting ? 'Generating…' : 'Export PDF'}
              </button>
            </div>
          )}
        </div>
      )}
      {/* Active filter pill */}
      {(selectedYear || selectedQuarter) && (
        <div className="flex items-center gap-2 mb-4 print:hidden">
          {selectedYear && (
            <span className="text-xs bg-brand/10 text-brand border border-brand/20 px-2 py-1 rounded-lg">
              {selectedQuarter ? quarterLabel(selectedYear, selectedQuarter) : selectedYear}
            </span>
          )}
        </div>
      )}
      {/* ------------------------------------------------------------------ */}
      {/* Printable region — starts here (after address bar, blacklist,      */}
      {/* year/quarter filter)                                               */}
      {/* ------------------------------------------------------------------ */}
      <div ref={printRef} className={isExporting ? 'w-[92rem]' : ''}>
        {/* Print header — only visible when exporting */}
        <div className={`mb-6 ${isExporting ? 'block' : 'hidden'}`}>
          <h1 className="text-xl font-bold text-text-primary">Token Transfer Report</h1>
          {selectedAddresses.length > 0 && (
            <div className="mt-1 space-y-1.5">
              {selectedAddresses.map(a => (
                <div key={a.id} className="space-y-0.5">
                  {a.label && <p className="text-sm font-medium text-text-secondary">{a.label}</p>}
                  <p className="text-xs text-text-muted font-mono">{a.address}</p>
                  <p className="text-xs text-text-muted">{a.chain}</p>
                </div>
              ))}
            </div>
          )}
          {selectedYear && (
            <p className="text-sm text-text-muted">
              Period:{' '}
              {selectedQuarter
                ? quarterLabel(selectedYear, selectedQuarter)
                : `Full year ${selectedYear}`}
            </p>
          )}
        </div>

        {/* Overview */}
        <TokenOverviewSection
          overview={overview}
          prices={prices}
          tokenPrices={tokenPrices}
          year={selectedYear}
          isExporting={isExporting}
          onBlacklist={handleBlacklist}
          onAddCorrection={sym => setPrefillToken(sym)}
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
              prefillToken={prefillToken}
              onPrefillConsumed={() => setPrefillToken(null)}
              onMutate={() => void loadOverview(selectedIds, selectedYear, selectedQuarter)}
              isExporting={isExporting}
            />

            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 mt-8">
              Token Transfers
            </h3>

            <TransfersTable
              transfers={visible}
              addresses={selectedAddresses}
              loading={loadingTransfers}
              isExporting={isExporting}
              onUpdate={handleUpdateTransfer}
            />
          </>
        )}
      </div>{' '}
      {/* end printable region */}
    </div>
  );
}
