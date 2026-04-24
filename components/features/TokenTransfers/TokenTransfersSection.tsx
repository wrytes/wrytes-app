import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import generatePDF, { Margin } from 'react-to-pdf';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCoins,
  faPlus,
  faSync,
  faTrash,
  faChevronUp,
  faChevronDown,
  faArrowUpRightFromSquare,
  faExclamationTriangle,
  faBan,
  faPrint,
} from '@fortawesome/free-solid-svg-icons';
import { PageHeader, Section } from '@/components/ui/Layout';
import { Table, TableBody, TableHead, TableRow, TableRowEmpty } from '@/components/ui/Table';
import { EditableCell } from '@/components/ui/Table/EditableCell';
import { apiRequest } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format-handling';
import { CorrectionsTable } from './CorrectionsTable';
import { TransfersTable } from './TransfersTable';
import type {
  WalletAddress,
  Transfer,
  BlacklistEntry,
  TransferClassification,
  TokenOverviewResponse,
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
    <span className={`text-sm tabular-nums ${pos ? 'text-success' : 'text-error'}`}>
      {pos ? '+' : ''}CHF {fmtNum(value)}
    </span>
  );
}

function quarterLabel(year: number, quarter: number) {
  return `${QUARTERS[quarter - 1].label} ${year} (${QUARTERS[quarter - 1].months})`;
}

// ---------------------------------------------------------------------------
// AddressBar
// ---------------------------------------------------------------------------

function AddressBar({
  addresses,
  selectedId,
  syncing,
  onAdd,
  onSync,
  onRemove,
  onSelect,
}: {
  addresses: WalletAddress[];
  selectedId: string | null;
  syncing: string | null;
  onAdd: (address: string, chain: string, label: string) => Promise<void>;
  onSync: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onSelect: (id: string) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState('eth-mainnet');
  const [label, setLabel] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    if (!address.trim()) return;
    setAdding(true);
    setError('');
    try {
      await onAdd(address.trim(), chain, label.trim());
      setAddress('');
      setLabel('');
      setShowAdd(false);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to add address');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="mb-6 space-y-3 print:hidden">
      <div className="flex items-center gap-2 flex-wrap">
        {addresses.map(a => (
          <div key={a.id} className="flex items-center gap-1">
            <button
              onClick={() => onSelect(a.id)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                selectedId === a.id
                  ? 'bg-brand text-white'
                  : 'bg-card border border-table-alt text-text-secondary hover:text-brand'
              }`}
            >
              {a.label ?? `${a.address.slice(0, 6)}…${a.address.slice(-4)}`}
              <span className="ml-1.5 text-xs opacity-60">{a.chain.split('-')[0]}</span>
            </button>
            <button
              onClick={() => onSync(a.id)}
              disabled={syncing === a.id}
              className="text-text-muted hover:text-brand transition-colors p-1 disabled:opacity-50"
              title="Sync"
            >
              <FontAwesomeIcon
                icon={faSync}
                className={`w-3 h-3 ${syncing === a.id ? 'animate-spin' : ''}`}
              />
            </button>
            <button
              onClick={() => onRemove(a.id)}
              className="text-text-muted hover:text-error transition-colors p-1"
              title="Remove"
            >
              <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button
          onClick={() => setShowAdd(o => !o)}
          className="flex items-center gap-1.5 text-xs text-brand border border-brand/30 px-3 py-1.5 rounded-lg hover:bg-brand/10 transition-colors"
        >
          <FontAwesomeIcon icon={showAdd ? faChevronUp : faPlus} className="w-3 h-3" />
          {showAdd ? 'Cancel' : 'Add address'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-card rounded-lg p-4 border border-table-alt space-y-2">
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
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
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
  overview: TokenOverviewResponse | null;
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
            {byClassification.map(item => {
              const style = getStyle(item.classification);
              const label = CLASSIFICATION_LABEL[item.classification] ?? item.classification;
              return (
                <div
                  key={item.classification}
                  className="rounded-lg px-4 py-3 border border-table-alt bg-card space-y-1"
                >
                  <div className={`text-xs font-semibold ${style.color}`}>{label}</div>
                  <div className="text-sm font-bold text-text-primary tabular-nums">
                    {item.chfTotal > 0 ? `CHF ${fmtNum(item.chfTotal)}` : '—'}
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
                        <td className="px-4 py-3 font-semibold text-text-primary text-left">{t.tokenSymbol ?? 'Unknown'}</td>
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
                          <span className="font-semibold text-sm text-text-primary">{t.tokenSymbol ?? 'Unknown'}</span>
                          <button onClick={() => onAddCorrection(t.tokenSymbol)} className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-brand p-0.5" title="Add manual correction">
                            <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                          </button>
                          {t.tokenAddress && (
                            <button onClick={() => onBlacklist(t.tokenAddress!, overview.address.chainId, t.tokenSymbol)} className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-error p-0.5" title="Blacklist token">
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [total, setTotal] = useState(0);
  const [overview, setOverview] = useState<TokenOverviewResponse | null>(null);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [prices, setPrices] = useState<PriceMap>({});
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<number | null>(null);
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
      setSelectedId(prev => {
        const id = prev ?? first;
        void loadTransfers(id);
        void loadOverview(id, selectedYear, selectedQuarter);
        return id;
      });
    }
  }, []);

  const loadTransfers = useCallback(async (id: string) => {
    setLoadingTransfers(true);
    try {
      const data = await apiRequest<{ total: number; transfers: Transfer[] }>(
        `/accounting/addresses/${id}/transfers?take=500`
      );
      setTransfers(data.transfers);
      setTotal(data.total);
    } finally {
      setLoadingTransfers(false);
    }
  }, []);

  const loadTokenPrices = useCallback(async (id: string, year: number) => {
    const data = await apiRequest<TokenPriceMap>(
      `/accounting/addresses/${id}/token-prices?year=${year}`
    );
    setTokenPrices(data);
  }, []);

  const handleSaveTokenPrice = useCallback(
    async (tokenSymbol: string, priceChf: string | null) => {
      if (!selectedId || !selectedYear) return;
      await apiRequest(`/accounting/addresses/${selectedId}/token-prices`, {
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
    [selectedId, selectedYear]
  );

  const loadOverview = useCallback(
    async (id: string, year?: number | null, quarter?: number | null) => {
      const qs = new URLSearchParams();
      if (year) qs.set('year', String(year));
      if (quarter) qs.set('quarter', String(quarter));
      const data = await apiRequest<TokenOverviewResponse>(
        `/accounting/addresses/${id}/token-overview${qs.toString() ? '?' + qs : ''}`
      );
      setOverview(data);
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
      await Promise.all([loadTransfers(id), loadOverview(id, selectedYear, selectedQuarter)]);
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
    if (selectedId === id) {
      setSelectedId(null);
      setTransfers([]);
      setOverview(null);
    }
  };

  const handleSelectAddress = (id: string) => {
    setSelectedId(id);
    void loadTransfers(id);
    void loadOverview(id, selectedYear, selectedQuarter);
    if (selectedYear) void loadTokenPrices(id, selectedYear);
  };

  const handleYearChange = (year: number | null) => {
    setSelectedYear(year);
    setSelectedQuarter(null);
    if (selectedId) {
      void loadOverview(selectedId, year, null);
      if (year) void loadTokenPrices(selectedId, year);
      else setTokenPrices({});
    }
  };

  const handleQuarterChange = (quarter: number | null) => {
    setSelectedQuarter(quarter);
    if (selectedId) void loadOverview(selectedId, selectedYear, quarter);
  };

  const handleUpdateTransfer = useCallback(
    async (id: string, patch: { classification?: string; chfValue?: string | null }) => {
      const updated = await apiRequest<Transfer>(`/accounting/transfers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setTransfers(prev => prev.map(t => (t.id === id ? updated : t)));
      if (selectedId) void loadOverview(selectedId, selectedYear, selectedQuarter);
    },
    [selectedId, selectedYear, selectedQuarter, loadOverview]
  );

  const handleBlacklist = useCallback(
    async (tokenAddress: string, chainId: number, tokenSymbol: string | null) => {
      await apiRequest('/accounting/blacklist', {
        method: 'POST',
        body: JSON.stringify({ tokenAddress, chainId, tokenSymbol }),
      });
      const [bl, data] = await Promise.all([
        apiRequest<BlacklistEntry[]>('/accounting/blacklist'),
        selectedId
          ? apiRequest<{ total: number; transfers: Transfer[] }>(
              `/accounting/addresses/${selectedId}/transfers?take=500`
            )
          : null,
        selectedId ? loadOverview(selectedId, selectedYear, selectedQuarter) : null,
      ] as const);
      setBlacklist(bl);
      if (data) {
        setTransfers(data.transfers);
        setTotal(data.total);
      }
    },
    [selectedId, selectedYear, selectedQuarter, loadOverview]
  );

  const handleUnblacklist = useCallback(
    async (id: string) => {
      await apiRequest(`/accounting/blacklist/${id}`, { method: 'DELETE' });
      setBlacklist(prev => prev.filter(e => e.id !== id));
      if (selectedId) {
        await Promise.all([
          loadTransfers(selectedId),
          loadOverview(selectedId, selectedYear, selectedQuarter),
        ]);
      }
    },
    [selectedId, selectedYear, selectedQuarter, loadTransfers, loadOverview]
  );

  useEffect(() => {
    if (!isExporting) return;
    const addr = selectedAddress;
    const label = addr?.label ?? addr?.address?.slice(0, 10) ?? 'report';
    const period = selectedYear
      ? selectedQuarter
        ? `${QUARTERS[selectedQuarter - 1].label}${selectedYear}`
        : `${selectedYear}`
      : 'all';
    // Size the PDF page to exactly the rendered content so no row gets sliced
    const el = printRef.current;
    const pxToMm = 0.264583;
    const widthMm = el ? el.scrollWidth * pxToMm : 210;
    const heightMm = el ? el.scrollHeight * pxToMm : 297;
    generatePDF(printRef, {
      filename: `token-transfers-${label}-${period}.pdf`,
      page: { margin: Margin.SMALL, format: [widthMm, heightMm] },
    });
    setIsExporting(false);
  }, [isExporting]);

  const selectedAddress = addresses.find(a => a.id === selectedId);
  const chainId = selectedAddress?.chainId ?? 1;

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
        if (selectedYear && d.getFullYear() !== selectedYear) return false;
        if (selectedQuarter && Math.ceil((d.getMonth() + 1) / 3) !== selectedQuarter) return false;
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
    <Section>
      <PageHeader
        title="Token Transfers"
        description="Track wallet transfers and classify them to compute asset, liability, and net positions."
        icon={faCoins}
      />
      <AddressBar
        addresses={addresses}
        selectedId={selectedId}
        syncing={syncing}
        onAdd={handleAddAddress}
        onSync={handleSync}
        onRemove={handleRemoveAddress}
        onSelect={handleSelectAddress}
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
          {selectedAddress && (
            <div className="mt-1 space-y-0.5">
              {selectedAddress.label && (
                <p className="text-sm font-medium text-text-secondary">{selectedAddress.label}</p>
              )}
              <p className="text-xs text-text-muted font-mono">{selectedAddress.address}</p>
              <p className="text-xs text-text-muted">{selectedAddress.chain}</p>
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
        {selectedId && (
          <>
            {/* Corrections / manual entries */}
            <CorrectionsTable
              addressId={selectedId}
              year={selectedYear}
              quarter={selectedQuarter}
              prefillToken={prefillToken}
              onPrefillConsumed={() => setPrefillToken(null)}
              onMutate={() =>
                selectedId && void loadOverview(selectedId, selectedYear, selectedQuarter)
              }
              isExporting={isExporting}
            />

            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 mt-8">
              Token Transfers
            </h3>

            <TransfersTable
              transfers={visible}
              loading={loadingTransfers}
              chainId={chainId}
              isExporting={isExporting}
              onUpdate={handleUpdateTransfer}
            />
          </>
        )}
      </div>{' '}
      {/* end printable region */}
    </Section>
  );
}
