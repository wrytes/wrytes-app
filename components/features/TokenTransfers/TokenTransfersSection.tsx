import { useState, useMemo, useCallback, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCoins,
  faPlus,
  faSync,
  faTrash,
  faChevronDown,
  faChevronUp,
  faArrowUpRightFromSquare,
  faArrowTrendUp,
  faArrowTrendDown,
} from '@fortawesome/free-solid-svg-icons';
import { PageHeader, Section } from '@/components/ui/Layout';
import { Badge } from '@/components/ui';
import { Table, TableBody, TableHead, TableRow, TableRowEmpty } from '@/components/ui/Table';
import { apiRequest } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format-handling';
import type {
  AccountingAddress,
  AccountingTransfer,
  TransferClassification,
} from '../Accounting/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TokenBalance {
  tokenSymbol: string | null;
  tokenAddress: string | null;
  tokenType: string;
  totalIn: number;
  totalOut: number;
  balance: number;
  chfTotal: number;
  byClassification: Record<string, number>;
  inCount: number;
  outCount: number;
}

interface TokenBalancesResponse {
  address: AccountingAddress;
  tokens: TokenBalance[];
}

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

const CLASSIFICATION_OPTIONS = [
  { label: 'Unclassified', value: 'UNCLASSIFIED' },
  { label: 'Asset', value: 'ASSET' },
  { label: 'Received', value: 'RECEIVED' },
  { label: 'Swap In', value: 'SWAP_IN' },
  { label: 'Liability', value: 'LIABILITY' },
  { label: 'Payment', value: 'PAYMENT' },
  { label: 'Swap Out', value: 'SWAP_OUT' },
  { label: 'Transfer', value: 'TRANSFER' },
  { label: 'Skipped', value: 'SKIPPED' },
];

const CLASSIFICATION_STYLE: Record<TransferClassification, { color: string; bg: string }> = {
  ASSET: { color: 'text-success', bg: 'bg-success-bg' },
  RECEIVED: { color: 'text-success', bg: 'bg-success-bg' },
  SWAP_IN: { color: 'text-info', bg: 'bg-info/10' },
  LIABILITY: { color: 'text-error', bg: 'bg-error-bg' },
  PAYMENT: { color: 'text-error', bg: 'bg-error-bg' },
  SWAP_OUT: { color: 'text-warning', bg: 'bg-warning/10' },
  TRANSFER: { color: 'text-brand', bg: 'bg-brand/10' },
  SKIPPED: { color: 'text-text-muted', bg: 'bg-surface' },
  UNCLASSIFIED: { color: 'text-text-secondary', bg: 'bg-surface' },
};

const TRANSFER_HEADERS = ['Date', 'Token', 'Amount', 'CHF', 'Classification'];

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

// ---------------------------------------------------------------------------
// TokenBalanceList
// ---------------------------------------------------------------------------

const TOKEN_LIST_HEADERS = [
  'Token',
  'Balance',
  'In',
  'Out',
  'CHF Total',
  'Transfers',
  'Classification',
];

function TokenBalanceList({ tokens }: { tokens: TokenBalance[] }) {
  if (tokens.length === 0) {
    return (
      <p className="text-center text-text-muted text-sm py-8">
        Sync an address to see token balances.
      </p>
    );
  }

  return (
    <div className="mb-6">
      <Table>
        <TableHead headers={TOKEN_LIST_HEADERS} colSpan={TOKEN_LIST_HEADERS.length} />
        <TableBody>
          {tokens.map(t => {
            const key = t.tokenAddress ?? t.tokenSymbol ?? 'UNKNOWN';
            const isPositive = t.balance >= 0;
            const dominant = Object.entries(t.byClassification)
              .filter(([c]) => c !== 'UNCLASSIFIED' && c !== 'SKIPPED')
              .sort(([, a], [, b]) => b - a)[0]?.[0] as TransferClassification | undefined;
            const accentStyle = dominant ? CLASSIFICATION_STYLE[dominant] : null;

            return (
              <TableRow
                key={key}
                headers={TOKEN_LIST_HEADERS}
                colSpan={TOKEN_LIST_HEADERS.length}
                rawHeader
              >
                {/* Token */}
                <div className="text-left font-semibold text-sm text-text-primary">
                  {t.tokenSymbol ?? 'Unknown'}
                </div>

                {/* Balance */}
                <div
                  className={`text-sm font-bold tabular-nums ${isPositive ? 'text-success' : 'text-error'}`}
                >
                  {isPositive ? '+' : ''}
                  {formatCurrency(t.balance, 0, 6) ?? '0'}
                </div>

                {/* In */}
                <div className="text-sm text-success tabular-nums">
                  <FontAwesomeIcon icon={faArrowTrendUp} className="w-3 h-3 mr-1 opacity-70" />
                  {formatCurrency(t.totalIn, 0, 6) ?? '0'}
                </div>

                {/* Out */}
                <div className="text-sm text-error tabular-nums">
                  <FontAwesomeIcon icon={faArrowTrendDown} className="w-3 h-3 mr-1 opacity-70" />
                  {formatCurrency(t.totalOut, 0, 6) ?? '0'}
                </div>

                {/* CHF total */}
                <div className="text-sm text-text-secondary tabular-nums">
                  {t.chfTotal > 0 ? `CHF ${formatCurrency(t.chfTotal, 0, 2) ?? '—'}` : '—'}
                </div>

                {/* Transfer count */}
                <div className="text-xs text-text-muted">
                  {t.inCount + t.outCount}
                  <span className="opacity-60 ml-1">
                    ({t.inCount}↑ {t.outCount}↓)
                  </span>
                </div>

                {/* Dominant classification */}
                <div>
                  {accentStyle && dominant ? (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${accentStyle.bg} ${accentStyle.color}`}
                    >
                      {CLASSIFICATION_OPTIONS.find(o => o.value === dominant)?.label ?? dominant}
                    </span>
                  ) : (
                    <span className="text-xs text-text-muted">—</span>
                  )}
                </div>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
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
      {/* Address tabs */}
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

      {/* Add form */}
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
// Main
// ---------------------------------------------------------------------------

export function TokenTransfersSection() {
  const [addresses, setAddresses] = useState<AccountingAddress[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transfers, setTransfers] = useState<AccountingTransfer[]>([]);
  const [total, setTotal] = useState(0);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');

  useEffect(() => {
    void loadAddresses();
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
        void loadTokenBalances(id);
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

  const loadTokenBalances = useCallback(async (id: string) => {
    const data = await apiRequest<TokenBalancesResponse>(
      `/accounting/addresses/${id}/token-balances`
    );
    setTokenBalances(data.tokens);
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
      await Promise.all([loadTransfers(id), loadTokenBalances(id)]);
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
      setTokenBalances([]);
    }
  };

  const handleSelectAddress = (id: string) => {
    setSelectedId(id);
    void loadTransfers(id);
    void loadTokenBalances(id);
  };

  const handleUpdateTransfer = useCallback(
    async (id: string, classification: string) => {
      const updated = await apiRequest<AccountingTransfer>(`/accounting/transfers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ classification }),
      });
      setTransfers(prev => prev.map(t => (t.id === id ? updated : t)));
      if (selectedId) void loadTokenBalances(selectedId);
    },
    [selectedId, loadTokenBalances]
  );

  const selectedAddress = addresses.find(a => a.id === selectedId);

  const visible = useMemo(() => {
    const q = search.toLowerCase().trim();
    return transfers.filter(t => {
      if (t.isHidden) return false;
      if (classFilter && t.classification !== classFilter) return false;
      if (!q) return true;
      return (t.tokenSymbol ?? '').toLowerCase().includes(q) || t.txHash.toLowerCase().includes(q);
    });
  }, [transfers, search, classFilter]);

  const chainId = selectedAddress?.chainId ?? 1;

  return (
    <Section>
      <PageHeader
        title="Token Transfers"
        description="Track your wallet token balances and classify each transfer."
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

      {/* Token balance list */}
      <TokenBalanceList tokens={tokenBalances} />

      {/* Transfer table */}
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
                  const cls = CLASSIFICATION_STYLE[t.classification];
                  const isIn = t.direction === 'IN';
                  const txUrl = explorerTxUrl(chainId, t.txHash);

                  return (
                    <TableRow
                      key={t.id}
                      headers={TRANSFER_HEADERS}
                      colSpan={TRANSFER_HEADERS.length}
                      rawHeader
                    >
                      {/* Date — clickable link to explorer */}
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

                      {/* Amount + direction merged */}
                      <div className="text-right">
                        <span
                          className={`text-sm font-semibold tabular-nums ${
                            isIn ? 'text-success' : 'text-error'
                          }`}
                        >
                          {isIn ? '+' : '−'}
                          {formatCurrency(parseFloat(t.amountFormatted ?? '0'), 0, 6) ?? '—'}
                          <span className="font-normal text-text-muted ml-1 text-xs">
                            {t.tokenSymbol}
                          </span>
                        </span>
                      </div>

                      {/* CHF value */}
                      <div className="text-right">
                        {t.chfValue ? (
                          <span className="text-sm text-text-secondary tabular-nums">
                            CHF {formatCurrency(parseFloat(t.chfValue), 0, 2)}
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted italic">—</span>
                        )}
                      </div>

                      {/* Classification */}
                      <div className="flex justify-end" onClick={e => e.stopPropagation()}>
                        <select
                          value={t.classification}
                          onChange={e => handleUpdateTransfer(t.id, e.target.value)}
                          className={`text-xs rounded-lg px-2 py-1 border-transparent outline-none cursor-pointer ${cls.bg} ${cls.color}`}
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
