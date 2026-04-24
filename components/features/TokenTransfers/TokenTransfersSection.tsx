import { useState, useMemo, useCallback, useEffect } from 'react';
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
} from '@fortawesome/free-solid-svg-icons';
import { PageHeader, Section } from '@/components/ui/Layout';
import { Table, TableBody, TableHead, TableRow, TableRowEmpty } from '@/components/ui/Table';
import { EditableCell } from '@/components/ui/Table/EditableCell';
import { apiRequest } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format-handling';
import type {
  AccountingAddress,
  AccountingTransfer,
  AccountingBlacklistEntry,
  TransferClassification,
  TokenOverviewResponse,
} from '../Accounting/types';

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

// Primary classification options for the dropdown
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

// Display label for any classification value (including legacy)
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
  return formatCurrency(n, 0, decimals) ?? '0';
}

function dust(n: number) {
  return Math.abs(n) < 0.01 ? 0 : n;
}

function chfCell(value: number) {
  if (!value) return <span className="text-text-muted text-xs">—</span>;
  const pos = value >= 0;
  return (
    <span className={`text-sm tabular-nums ${pos ? 'text-success' : 'text-error'}`}>
      {pos ? '+' : ''}CHF {fmtNum(value)}
    </span>
  );
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
  addresses: AccountingAddress[];
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
    <div className="mb-6 space-y-3">
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
// TokenOverviewSection — per-token asset/liability/net + classification totals
// ---------------------------------------------------------------------------

type PriceMap = Record<string, { chf: number | null }>;

// ---------------------------------------------------------------------------
// BlacklistPanel
// ---------------------------------------------------------------------------

function BlacklistPanel({
  blacklist,
  onRemove,
}: {
  blacklist: AccountingBlacklistEntry[];
  onRemove: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-6">
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
                  {entry.reason && (
                    <span className="ml-2 text-xs text-text-muted italic">{entry.reason}</span>
                  )}
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

const TOKEN_OVERVIEW_HEADERS = ['Token', 'Asset', 'Liability', 'Net', 'Accounted', 'Delta'];

function TokenOverviewSection({
  overview,
  prices,
  onBlacklist,
}: {
  overview: TokenOverviewResponse | null;
  prices: PriceMap;
  onBlacklist: (tokenAddress: string, chainId: number, tokenSymbol: string | null) => Promise<void>;
}) {
  if (!overview) {
    return (
      <p className="text-center text-text-muted text-sm py-8">
        Sync an address and classify transfers to see the overview.
      </p>
    );
  }

  const { tokens, byClassification, unclassifiedCount } = overview;
  const pricesByLower = useMemo(
    () => Object.fromEntries(Object.entries(prices).map(([k, v]) => [k.toLowerCase(), v])),
    [prices]
  );

  return (
    <div className="space-y-6 mb-8">
      {/* Unclassified alert */}
      {unclassifiedCount > 0 && (
        <div className="flex items-center gap-2 bg-warning/10 border border-warning/30 rounded-lg px-4 py-2.5 text-sm text-warning">
          <FontAwesomeIcon icon={faExclamationTriangle} className="w-3.5 h-3.5 shrink-0" />
          <span>
            <strong>{unclassifiedCount}</strong> transfer{unclassifiedCount !== 1 ? 's' : ''} not
            yet classified — scroll down to classify them.
          </span>
        </div>
      )}

      {/* Token table */}
      {tokens.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            Token Balances
          </h3>
          <Table>
            <TableHead headers={TOKEN_OVERVIEW_HEADERS} colSpan={TOKEN_OVERVIEW_HEADERS.length} />
            <TableBody>
              {tokens
                .filter(t => dust(t.net) !== 0 || t.chfNet !== 0)
                .map(t => {
                  const key = t.tokenAddress ?? t.tokenSymbol ?? 'UNKNOWN';
                  const priceChf = t.tokenSymbol
                    ? (pricesByLower[t.tokenSymbol.toLowerCase()]?.chf ?? null)
                    : null;
                  const net = dust(t.net);
                  const asset = dust(t.asset);
                  const liability = dust(t.liability);
                  const marketValue = priceChf !== null ? net * priceChf : null;
                  const delta =
                    marketValue !== null
                      ? marketValue - t.chfNet
                      : t.chfNet !== 0
                        ? -t.chfNet
                        : null;

                  return (
                    <TableRow
                      key={key}
                      headers={TOKEN_OVERVIEW_HEADERS}
                      colSpan={TOKEN_OVERVIEW_HEADERS.length}
                      rawHeader
                    >
                      {/* Token */}
                      <div className="group flex items-center gap-2 text-left">
                        <div>
                          <span className="font-semibold text-sm text-text-primary">
                            {t.tokenSymbol ?? 'Unknown'}
                          </span>
                          {priceChf !== null && (
                            <span className="ml-1.5 text-xs text-text-muted">
                              ({fmtNum(priceChf)} CHF)
                            </span>
                          )}
                        </div>
                        {t.tokenAddress && (
                          <button
                            onClick={() =>
                              onBlacklist(t.tokenAddress!, overview.address.chainId, t.tokenSymbol)
                            }
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted hover:text-error p-0.5"
                            title="Blacklist token"
                          >
                            <FontAwesomeIcon icon={faBan} className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Asset */}
                      <div
                        className={`text-sm tabular-nums font-medium ${asset === 0 ? 'text-text-muted' : asset > 0 ? 'text-success' : 'text-error'}`}
                      >
                        {asset === 0 ? '—' : `${asset > 0 ? '+' : ''}${fmtNum(asset, 4)}`}
                      </div>

                      {/* Liability */}
                      <div
                        className={`text-sm tabular-nums font-medium ${liability === 0 ? 'text-text-muted' : 'text-error'}`}
                      >
                        {liability === 0 ? '—' : fmtNum(liability, 4)}
                      </div>

                      {/* Net */}
                      <div
                        className={`text-sm tabular-nums font-bold ${net === 0 ? 'text-text-muted' : net > 0 ? 'text-success' : 'text-error'}`}
                      >
                        {net === 0 ? '—' : `${net > 0 ? '+' : ''}${fmtNum(net, 4)}`}
                      </div>

                      {/* Accounted (was CHF Net) */}
                      <div className="text-right">{chfCell(t.chfNet)}</div>

                      {/* Delta = market value − accounted */}
                      <div className="text-right">
                        {delta === null ? (
                          <span className="text-text-muted text-xs">—</span>
                        ) : (
                          <span
                            className={`text-sm tabular-nums font-medium ${delta >= 0 ? 'text-success' : 'text-error'}`}
                          >
                            {delta >= 0 ? '+' : ''}CHF {fmtNum(delta)}
                          </span>
                        )}
                      </div>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Classification totals */}
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
                  className={`rounded-lg px-4 py-3 border border-table-alt bg-card space-y-1`}
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const TRANSFER_HEADERS = ['Date', 'Token', 'Amount', 'CHF', 'Classification'];

export function TokenTransfersSection() {
  const [addresses, setAddresses] = useState<AccountingAddress[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transfers, setTransfers] = useState<AccountingTransfer[]>([]);
  const [total, setTotal] = useState(0);
  const [overview, setOverview] = useState<TokenOverviewResponse | null>(null);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [chfEditing, setChfEditing] = useState<{ id: string; value: string } | null>(null);
  const [prices, setPrices] = useState<PriceMap>({});
  const [blacklist, setBlacklist] = useState<AccountingBlacklistEntry[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    void loadAddresses();
    void apiRequest<PriceMap>('/prices')
      .then(setPrices)
      .catch(() => {});
    void apiRequest<AccountingBlacklistEntry[]>('/accounting/blacklist')
      .then(setBlacklist)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAddresses = useCallback(async () => {
    const data = await apiRequest<AccountingAddress[]>('/accounting/addresses');
    setAddresses(data);
    if (data.length > 0) {
      const first = data[0].id;
      setSelectedId(prev => {
        const id = prev ?? first;
        void loadTransfers(id);
        void loadOverview(id, selectedYear);
        return id;
      });
    }
  }, []);

  const loadTransfers = useCallback(async (id: string) => {
    setLoadingTransfers(true);
    try {
      const data = await apiRequest<{ total: number; transfers: AccountingTransfer[] }>(
        `/accounting/addresses/${id}/transfers?take=500`
      );
      setTransfers(data.transfers);
      setTotal(data.total);
    } finally {
      setLoadingTransfers(false);
    }
  }, []);

  const loadOverview = useCallback(async (id: string, year?: number | null) => {
    const qs = year ? `?year=${year}` : '';
    const data = await apiRequest<TokenOverviewResponse>(
      `/accounting/addresses/${id}/token-overview${qs}`
    );
    setOverview(data);
  }, []);

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
      await Promise.all([loadTransfers(id), loadOverview(id, selectedYear)]);
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
    void loadOverview(id, selectedYear);
  };

  const handleUpdateTransfer = useCallback(
    async (id: string, patch: { classification?: string; chfValue?: string | null }) => {
      const updated = await apiRequest<AccountingTransfer>(`/accounting/transfers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setTransfers(prev => prev.map(t => (t.id === id ? updated : t)));
      if (selectedId) void loadOverview(selectedId, selectedYear);
    },
    [selectedId, loadOverview]
  );

  const handleSaveChf = useCallback(async () => {
    if (!chfEditing) return;
    const raw = chfEditing.value.trim();
    const chfValue = raw === '' ? null : raw;
    await handleUpdateTransfer(chfEditing.id, { chfValue });
    setChfEditing(null);
  }, [chfEditing, handleUpdateTransfer]);

  const handleBlacklist = useCallback(
    async (tokenAddress: string, chainId: number, tokenSymbol: string | null) => {
      await apiRequest('/accounting/blacklist', {
        method: 'POST',
        body: JSON.stringify({ tokenAddress, chainId, tokenSymbol }),
      });
      const [bl, data] = await Promise.all([
        apiRequest<AccountingBlacklistEntry[]>('/accounting/blacklist'),
        selectedId
          ? apiRequest<{ total: number; transfers: AccountingTransfer[] }>(
              `/accounting/addresses/${selectedId}/transfers?take=500`
            )
          : null,
        selectedId ? loadOverview(selectedId, selectedYear) : null,
      ] as const);
      setBlacklist(bl);
      if (data) {
        setTransfers(data.transfers);
        setTotal(data.total);
      }
    },
    [selectedId, loadOverview]
  );

  const handleUnblacklist = useCallback(
    async (id: string) => {
      await apiRequest(`/accounting/blacklist/${id}`, { method: 'DELETE' });
      setBlacklist(prev => prev.filter(e => e.id !== id));
      if (selectedId) {
        await Promise.all([loadTransfers(selectedId), loadOverview(selectedId, selectedYear)]);
      }
    },
    [selectedId, loadTransfers, loadOverview]
  );

  const selectedAddress = addresses.find(a => a.id === selectedId);
  const chainId = selectedAddress?.chainId ?? 1;

  const blacklistedAddresses = useMemo(
    () => new Set(blacklist.map(e => e.tokenAddress.toLowerCase())),
    [blacklist]
  );

  const visible = useMemo(() => {
    const q = search.toLowerCase().trim();
    return transfers.filter(t => {
      if (t.isHidden) return false;
      if (t.tokenAddress && blacklistedAddresses.has(t.tokenAddress.toLowerCase())) return false;
      if (classFilter && t.classification !== classFilter) return false;
      if (selectedYear && t.timestamp && new Date(t.timestamp).getFullYear() !== selectedYear)
        return false;
      if (!q) return true;
      return (t.tokenSymbol ?? '').toLowerCase().includes(q) || t.txHash.toLowerCase().includes(q);
    });
  }, [transfers, search, classFilter, blacklistedAddresses, selectedYear]);

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

      {/* Year selector */}
      {overview && overview.years.length > 0 && (
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => {
              setSelectedYear(null);
              if (selectedId) void loadOverview(selectedId, null);
            }}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              selectedYear === null
                ? 'bg-brand text-white'
                : 'bg-card border border-table-alt text-text-secondary hover:text-brand'
            }`}
          >
            All years
          </button>
          {overview.years.map(y => (
            <button
              key={y}
              onClick={() => {
                setSelectedYear(y);
                if (selectedId) void loadOverview(selectedId, y);
              }}
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
      )}

      {/* Overview */}
      <TokenOverviewSection overview={overview} prices={prices} onBlacklist={handleBlacklist} />

      {/* Transfer list */}
      {selectedId && (
        <>
          {/* Search + filter toolbar */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by token or tx hash…"
              className="flex-1 min-w-48 bg-transparent border border-table-alt rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand"
            />
            <select
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              className="bg-card border border-table-alt rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
            >
              <option value="">All classifications</option>
              {CLASSIFICATION_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {selectedYear && (
              <span className="text-xs bg-brand/10 text-brand border border-brand/20 px-2 py-1 rounded-lg whitespace-nowrap">
                {selectedYear}
              </span>
            )}
            {total > visible.length && (
              <span className="text-xs text-text-muted whitespace-nowrap">
                {visible.length} of {total}
              </span>
            )}
          </div>

          <Table>
            <TableHead headers={TRANSFER_HEADERS} colSpan={TRANSFER_HEADERS.length} />
            <TableBody>
              {loadingTransfers ? (
                <TableRowEmpty>Loading transfers…</TableRowEmpty>
              ) : visible.length === 0 ? (
                <TableRowEmpty>
                  {transfers.length === 0
                    ? 'No transfers yet — click Sync on the address above.'
                    : 'No transfers match your filter.'}
                </TableRowEmpty>
              ) : (
                visible.map(t => {
                  const cls = getStyle(t.classification);
                  const isIn = t.direction === 'IN';
                  const txUrl = explorerTxUrl(chainId, t.txHash);

                  return (
                    <TableRow
                      key={t.id}
                      headers={TRANSFER_HEADERS}
                      colSpan={TRANSFER_HEADERS.length}
                      rawHeader
                    >
                      {/* Date */}
                      <div className="text-left">
                        {txUrl ? (
                          <a
                            href={txUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand transition-colors"
                            onClick={e => e.stopPropagation()}
                          >
                            {formatDate(t.timestamp)}
                            <FontAwesomeIcon
                              icon={faArrowUpRightFromSquare}
                              className="w-2.5 h-2.5 opacity-60"
                            />
                          </a>
                        ) : (
                          <span className="text-sm text-text-secondary">
                            {formatDate(t.timestamp)}
                          </span>
                        )}
                      </div>

                      {/* Token */}
                      <div className="text-right">
                        <span className="font-medium text-sm text-text-primary">
                          {t.tokenSymbol ?? '?'}
                        </span>
                      </div>

                      {/* Amount + direction */}
                      <div className="text-right">
                        <span
                          className={`text-sm font-semibold tabular-nums ${
                            isIn ? 'text-success' : 'text-error'
                          }`}
                        >
                          {isIn ? '+' : '−'}
                          {fmtNum(parseFloat(t.amountFormatted ?? '0'), 6)}
                          <span className="font-normal text-text-muted ml-1 text-xs">
                            {t.tokenSymbol}
                          </span>
                        </span>
                      </div>

                      {/* CHF value — editable */}
                      <div onClick={e => e.stopPropagation()}>
                        <EditableCell
                          value={t.chfValue ? `CHF ${fmtNum(parseFloat(t.chfValue))}` : null}
                          isEditing={chfEditing?.id === t.id}
                          editValue={chfEditing?.id === t.id ? chfEditing.value : ''}
                          onEdit={() => setChfEditing({ id: t.id, value: t.chfValue ?? '' })}
                          onSave={handleSaveChf}
                          onCancel={() => setChfEditing(null)}
                          onChange={v => setChfEditing({ id: t.id, value: v })}
                          placeholder="0.00"
                          emptyText="Set CHF"
                        />
                      </div>

                      {/* Classification dropdown */}
                      <div className="flex justify-end min-w-0" onClick={e => e.stopPropagation()}>
                        <select
                          value={t.classification}
                          onChange={e =>
                            handleUpdateTransfer(t.id, { classification: e.target.value })
                          }
                          className={`text-xs rounded-lg px-2 py-1 border-transparent outline-none cursor-pointer max-w-full ${cls.bg} ${cls.color}`}
                        >
                          {CLASSIFICATION_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </>
      )}
    </Section>
  );
}
