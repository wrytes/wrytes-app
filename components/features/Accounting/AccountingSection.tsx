import { useState, useMemo, useCallback, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faScaleBalanced,
  faPlus,
  faSync,
  faTrash,
  faEyeSlash,
  faEye,
  faBan,
  faChevronDown,
  faChevronUp,
  faPrint,
  faArrowUpRightFromSquare,
} from '@fortawesome/free-solid-svg-icons';
import { PageHeader, Section } from '@/components/ui/Layout';
import { Badge } from '@/components/ui';
import { AddressDisplay } from '@/components/ui/AddressDisplay';
import {
  Table,
  TableBody,
  TableHeadSearchable,
  TableRow,
  TableRowEmpty,
} from '@/components/ui/Table';
import { useSort } from '@/hooks/useSort';
import { apiRequest } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format-handling';
import { AccountsPanel } from './AccountsPanel';
import { TemplatesPanel } from './TemplatesPanel';
import type {
  AccountingAddress,
  AccountingTransfer,
  AccountingBlacklistEntry,
  AccountingAccount,
  ClassificationTemplate,
  TrialBalanceLine,
  TransferClassification,
  AccountType,
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

const CHAIN_ID_MAP: Record<string, number> = Object.fromEntries(
  SUPPORTED_CHAINS.map(c => [c.value, c.chainId])
);

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

// positive = green, negative = red, directional = blue, neutral = grey, unclassified = yellow
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

const CLASSIFICATION_FILTER = [
  { label: 'Asset', value: 'ASSET' },
  { label: 'Received', value: 'RECEIVED' },
  { label: 'Swap In', value: 'SWAP_IN' },
  { label: 'Liability', value: 'LIABILITY' },
  { label: 'Payment', value: 'PAYMENT' },
  { label: 'Swap Out', value: 'SWAP_OUT' },
  { label: 'Transfer', value: 'TRANSFER' },
  { label: 'Skipped', value: 'SKIPPED' },
  { label: 'Unclassified', value: 'UNCLASSIFIED' },
];

const DIRECTION_FILTER = [
  { label: 'In', value: 'IN' },
  { label: 'Out', value: 'OUT' },
];

const TRANSFER_HEADERS = ['Date', 'Token', 'Amount', 'CHF Value', 'Counterparty', 'Classification'];

const ACCOUNT_TYPE_ORDER: AccountType[] = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  ASSET: 'Assets',
  LIABILITY: 'Liabilities',
  EQUITY: 'Equity',
  REVENUE: 'Revenue',
  EXPENSE: 'Expenses',
};
const ACCOUNT_TYPE_COLOR: Record<AccountType, string> = {
  ASSET: 'text-success',
  LIABILITY: 'text-error',
  EQUITY: 'text-brand',
  REVENUE: 'text-info',
  EXPENSE: 'text-warning',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function explorerTxUrl(chainId: number, txHash: string) {
  const base = EXPLORER_BASE[chainId];
  return base ? `${base}/tx/${txHash}` : null;
}

function explorerAddrUrl(chainId: number, address: string) {
  const base = EXPLORER_BASE[chainId];
  return base ? `${base}/address/${address}` : null;
}

function explorerTokenUrl(chainId: number, tokenAddress: string) {
  const base = EXPLORER_BASE[chainId];
  return base ? `${base}/token/${tokenAddress}` : null;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-CH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatAmount(val: string | null | number) {
  if (val === null || val === undefined || val === '') return '—';
  const n = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(n)) return String(val);
  return n.toLocaleString('en-CH', { maximumFractionDigits: 6 });
}

// ---------------------------------------------------------------------------
// TrialBalance
// ---------------------------------------------------------------------------

function TrialBalance({ lines }: { lines: TrialBalanceLine[] }) {
  const hasChf = lines.some(l => l.chfDebit > 0 || l.chfCredit > 0);
  const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.000001;

  return (
    <div
      className="bg-card rounded-lg border border-table-alt overflow-hidden print:break-inside-avoid mb-6"
      id="accounting-summary"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-table-alt">
        <h3 className="font-semibold text-text-primary text-sm flex items-center gap-2">
          <FontAwesomeIcon icon={faScaleBalanced} className="w-3.5 h-3.5 text-brand" />
          Trial Balance
        </h3>
        <div className="flex items-center gap-3">
          {lines.length > 0 && (
            <span className={`text-xs font-medium ${balanced ? 'text-success' : 'text-error'}`}>
              {balanced ? '✓ Balanced' : '⚠ Out of balance'}
            </span>
          )}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-brand transition-colors print:hidden"
          >
            <FontAwesomeIcon icon={faPrint} className="w-3 h-3" />
            Print
          </button>
        </div>
      </div>

      {lines.length === 0 ? (
        <p className="text-center text-text-muted text-sm py-6">
          Classify transfers to populate the trial balance.
        </p>
      ) : (
        <>
          <div
            className={`grid px-4 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-table-alt ${hasChf ? 'grid-cols-6' : 'grid-cols-4'}`}
          >
            <span className="col-span-2">Account</span>
            <span className="text-right">Debit</span>
            <span className="text-right">Credit</span>
            {hasChf && (
              <>
                <span className="text-right">CHF Debit</span>
                <span className="text-right">CHF Credit</span>
              </>
            )}
          </div>
          {ACCOUNT_TYPE_ORDER.map(type => {
            const group = lines.filter(l => l.type === type);
            if (group.length === 0) return null;
            const subtotalDebit = group.reduce((s, l) => s + l.debit, 0);
            const subtotalCredit = group.reduce((s, l) => s + l.credit, 0);
            const subtotalChfDr = group.reduce((s, l) => s + l.chfDebit, 0);
            const subtotalChfCr = group.reduce((s, l) => s + l.chfCredit, 0);
            return (
              <div key={type}>
                <div className="px-4 py-1.5 bg-surface/50 border-b border-table-alt">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${ACCOUNT_TYPE_COLOR[type]}`}
                  >
                    {ACCOUNT_TYPE_LABEL[type]}
                  </span>
                </div>
                {group.map(acc => (
                  <div
                    key={acc.id}
                    className={`grid px-4 py-2.5 text-sm border-b border-table-alt/50 hover:bg-surface/30 ${hasChf ? 'grid-cols-6' : 'grid-cols-4'}`}
                  >
                    <div className="col-span-2 flex items-center gap-2">
                      {acc.code && (
                        <span className="text-xs text-text-muted font-mono w-10 shrink-0">
                          {acc.code}
                        </span>
                      )}
                      <span className="text-text-primary">{acc.name}</span>
                    </div>
                    <span className="text-right text-text-secondary tabular-nums">
                      {acc.debit > 0 ? formatCurrency(acc.debit) : '—'}
                    </span>
                    <span className="text-right text-text-secondary tabular-nums">
                      {acc.credit > 0 ? formatCurrency(acc.credit) : '—'}
                    </span>
                    {hasChf && (
                      <>
                        <span className="text-right text-text-muted tabular-nums text-xs">
                          {acc.chfDebit > 0 ? `CHF ${formatCurrency(acc.chfDebit)}` : '—'}
                        </span>
                        <span className="text-right text-text-muted tabular-nums text-xs">
                          {acc.chfCredit > 0 ? `CHF ${formatCurrency(acc.chfCredit)}` : '—'}
                        </span>
                      </>
                    )}
                  </div>
                ))}
                <div
                  className={`grid px-4 py-2 text-xs font-semibold text-text-secondary bg-surface/30 border-b border-table-alt ${hasChf ? 'grid-cols-6' : 'grid-cols-4'}`}
                >
                  <span className="col-span-2 text-text-muted italic">Subtotal</span>
                  <span className="text-right tabular-nums">
                    {subtotalDebit > 0 ? formatCurrency(subtotalDebit) : '—'}
                  </span>
                  <span className="text-right tabular-nums">
                    {subtotalCredit > 0 ? formatCurrency(subtotalCredit) : '—'}
                  </span>
                  {hasChf && (
                    <>
                      <span className="text-right tabular-nums">
                        {subtotalChfDr > 0 ? `CHF ${formatCurrency(subtotalChfDr)}` : '—'}
                      </span>
                      <span className="text-right tabular-nums">
                        {subtotalChfCr > 0 ? `CHF ${formatCurrency(subtotalChfCr)}` : '—'}
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
          <div
            className={`grid px-4 py-3 text-sm font-bold text-text-primary bg-surface/50 ${hasChf ? 'grid-cols-6' : 'grid-cols-4'}`}
          >
            <span className="col-span-2">Total</span>
            <span className="text-right tabular-nums">{formatCurrency(totalDebit)}</span>
            <span className="text-right tabular-nums">{formatCurrency(totalCredit)}</span>
            {hasChf && (
              <>
                <span className="text-right tabular-nums text-xs">
                  CHF {formatCurrency(lines.reduce((s, l) => s + l.chfDebit, 0))}
                </span>
                <span className="text-right tabular-nums text-xs">
                  CHF {formatCurrency(lines.reduce((s, l) => s + l.chfCredit, 0))}
                </span>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AddressManager
// ---------------------------------------------------------------------------

function AddressManager({
  addresses,
  onAdd,
  onSync,
  onRemove,
  syncing,
}: {
  addresses: AccountingAddress[];
  onAdd: (address: string, chain: string, label: string) => Promise<void>;
  onSync: (id: string) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  syncing: string | null;
}) {
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
    } catch (e: any) {
      setError(e?.message ?? 'Failed to add address');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="mb-6 space-y-3">
      <div className="bg-card rounded-lg p-4 border border-table-alt">
        <p className="text-sm font-semibold text-text-secondary mb-3">Track a wallet address</p>
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
            className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
            Add
          </button>
        </div>
        {error && <p className="text-error text-xs mt-2">{error}</p>}
      </div>

      {addresses.map(a => (
        <div
          key={a.id}
          className="flex items-center justify-between bg-card border border-table-alt rounded-lg px-4 py-3"
        >
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {a.label && <span className="text-sm font-medium text-text-primary">{a.label}</span>}
              <AddressDisplay
                address={a.address}
                prefixLength={8}
                suffixLength={6}
                className="text-xs text-text-muted"
              />
              <Badge
                text={a.chain}
                variant="custom"
                customColor="text-brand"
                customBgColor="bg-brand/10"
                size="sm"
              />
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              {a.lastSyncedAt ? `Last synced ${formatDate(a.lastSyncedAt)}` : 'Never synced'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSync(a.id)}
              disabled={syncing === a.id}
              className="flex items-center gap-1.5 text-xs text-brand border border-brand/30 px-2 py-1 rounded-lg hover:bg-brand/10 transition-colors disabled:opacity-50"
            >
              <FontAwesomeIcon
                icon={faSync}
                className={`w-3 h-3 ${syncing === a.id ? 'animate-spin' : ''}`}
              />
              {syncing === a.id ? 'Syncing…' : 'Sync'}
            </button>
            <button
              onClick={() => onRemove(a.id)}
              className="text-text-muted hover:text-error transition-colors p-1"
              title="Remove"
            >
              <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BlacklistPanel
// ---------------------------------------------------------------------------

function BlacklistPanel({
  blacklist,
  onAdd,
  onRemove,
}: {
  blacklist: AccountingBlacklistEntry[];
  onAdd: (
    tokenAddress: string,
    chainId: number,
    tokenSymbol: string,
    reason: string
  ) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [tokenAddress, setTokenAddress] = useState('');
  const [chainId, setChainId] = useState(1);
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [reason, setReason] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!tokenAddress.trim()) return;
    setAdding(true);
    try {
      await onAdd(tokenAddress.trim(), chainId, tokenSymbol.trim(), reason.trim());
      setTokenAddress('');
      setTokenSymbol('');
      setReason('');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-card border border-table-alt rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
      >
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faBan} className="w-3.5 h-3.5 text-error" />
          Scam Token Blacklist
          {blacklist.length > 0 && (
            <span className="bg-error text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
              {blacklist.length}
            </span>
          )}
        </div>
        <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} className="w-3 h-3" />
      </button>

      {open && (
        <div className="border-t border-table-alt p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={tokenAddress}
              onChange={e => setTokenAddress(e.target.value)}
              placeholder="Token address 0x…"
              className="flex-1 bg-transparent border border-table-alt rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand"
            />
            <select
              value={chainId}
              onChange={e => setChainId(Number(e.target.value))}
              className="bg-card border border-table-alt rounded-lg px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
            >
              {SUPPORTED_CHAINS.map(c => (
                <option key={c.value} value={c.chainId}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={tokenSymbol}
              onChange={e => setTokenSymbol(e.target.value)}
              placeholder="Symbol"
              className="w-24 bg-transparent border border-table-alt rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand"
            />
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Reason"
              className="w-32 bg-transparent border border-table-alt rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !tokenAddress.trim()}
              className="flex items-center gap-1.5 bg-error/20 text-error border border-error/30 px-3 py-2 rounded-lg text-sm hover:bg-error/30 transition-colors disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faBan} className="w-3 h-3" />
              Block
            </button>
          </div>
          {blacklist.length > 0 && (
            <div className="space-y-1.5 mt-2">
              {blacklist.map(b => (
                <div key={b.id} className="flex items-center gap-3 text-xs text-text-secondary">
                  <AddressDisplay
                    address={b.tokenAddress}
                    prefixLength={6}
                    suffixLength={4}
                    className="text-text-muted"
                  />
                  {b.tokenSymbol && (
                    <span className="text-text-primary font-medium">{b.tokenSymbol}</span>
                  )}
                  <Badge
                    text={`chain:${b.chainId}`}
                    variant="custom"
                    customColor="text-text-muted"
                    customBgColor="bg-surface"
                    size="sm"
                  />
                  {b.reason && <span className="text-text-muted italic flex-1">{b.reason}</span>}
                  <button
                    onClick={() => onRemove(b.id)}
                    className="text-error hover:opacity-80 transition-opacity ml-auto"
                  >
                    <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AccountingSection() {
  const [addresses, setAddresses] = useState<AccountingAddress[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [transfers, setTransfers] = useState<AccountingTransfer[]>([]);
  const [total, setTotal] = useState(0);
  const [trialBalance, setTrialBalance] = useState<TrialBalanceLine[]>([]);
  const [accounts, setAccounts] = useState<AccountingAccount[]>([]);
  const [templates, setTemplates] = useState<ClassificationTemplate[]>([]);
  const [blacklist, setBlacklist] = useState<AccountingBlacklistEntry[]>([]);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [showHidden, setShowHidden] = useState(false);
  const [search, setSearch] = useState('');
  const [classificationFilters, setClassificationFilters] = useState<string[]>([]);
  const [directionFilters, setDirectionFilters] = useState<string[]>([]);
  const { sortTab, sortReverse, handleSort } = useSort('Date');

  const [chfEditing, setChfEditing] = useState<{ id: string; value: string } | null>(null);
  const [chfSaving, setChfSaving] = useState<string | null>(null);

  useEffect(() => {
    void loadAddresses();
    void loadBlacklist();
    void loadAccounts();
    void loadTemplates();
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
        void loadTrialBalance(id);
        return id;
      });
    }
  }, []);

  const loadTransfers = useCallback(
    async (id: string) => {
      setLoadingTransfers(true);
      try {
        const params = new URLSearchParams({ take: '500' });
        if (showHidden) params.set('showHidden', 'true');
        const data = await apiRequest<{ total: number; transfers: AccountingTransfer[] }>(
          `/accounting/addresses/${id}/transfers?${params}`
        );
        setTransfers(data.transfers);
        setTotal(data.total);
      } finally {
        setLoadingTransfers(false);
      }
    },
    [showHidden]
  );

  const loadTrialBalance = useCallback(async (addressId?: string) => {
    const params = addressId ? `?addressId=${addressId}` : '';
    const data = await apiRequest<TrialBalanceLine[]>(`/accounting/trial-balance${params}`);
    setTrialBalance(data);
  }, []);

  const loadAccounts = useCallback(async () => {
    const data = await apiRequest<AccountingAccount[]>('/accounting/accounts');
    setAccounts(data);
  }, []);

  const loadTemplates = useCallback(async () => {
    const data = await apiRequest<ClassificationTemplate[]>('/accounting/templates');
    setTemplates(data);
  }, []);

  const loadBlacklist = useCallback(async () => {
    const data = await apiRequest<AccountingBlacklistEntry[]>('/accounting/blacklist');
    setBlacklist(data);
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
      await Promise.all([loadTransfers(id), loadTrialBalance(id)]);
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
      setTrialBalance([]);
    }
  };

  const handleSelectAddress = (id: string) => {
    setSelectedId(id);
    void loadTransfers(id);
    void loadTrialBalance(id);
  };

  const handleUpdateTransfer = useCallback(
    async (
      id: string,
      data: {
        classification?: string;
        isHidden?: boolean;
        chfValue?: string | null;
        notes?: string | null;
      }
    ) => {
      const updated = await apiRequest<AccountingTransfer>(`/accounting/transfers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      setTransfers(prev => prev.map(t => (t.id === id ? updated : t)));
      if (selectedId) void loadTrialBalance(selectedId);
    },
    [selectedId, loadTrialBalance]
  );

  const handleChfSave = async (id: string, value: string) => {
    setChfEditing(null);
    setChfSaving(id);
    try {
      await handleUpdateTransfer(id, { chfValue: value.trim() || null });
    } finally {
      setChfSaving(null);
    }
  };

  const handleAddBlacklist = async (
    tokenAddress: string,
    chainId: number,
    tokenSymbol: string,
    reason: string
  ) => {
    await apiRequest('/accounting/blacklist', {
      method: 'POST',
      body: JSON.stringify({
        tokenAddress,
        chainId,
        tokenSymbol: tokenSymbol || undefined,
        reason: reason || undefined,
      }),
    });
    await loadBlacklist();
    if (selectedId) void loadTransfers(selectedId);
  };

  const handleRemoveBlacklist = async (id: string) => {
    await apiRequest(`/accounting/blacklist/${id}`, { method: 'DELETE' });
    await loadBlacklist();
  };

  const visible = useMemo(() => {
    const q = search.toLowerCase().trim();
    return [...transfers]
      .filter(t => {
        if (classificationFilters.length > 0 && !classificationFilters.includes(t.classification))
          return false;
        if (directionFilters.length > 0 && !directionFilters.includes(t.direction)) return false;
        if (!q) return true;
        return (
          (t.tokenSymbol ?? '').toLowerCase().includes(q) ||
          t.txHash.toLowerCase().includes(q) ||
          t.fromAddress.toLowerCase().includes(q) ||
          (t.toAddress ?? '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const m = sortReverse ? -1 : 1;
        switch (sortTab) {
          case 'Token':
            return m * (a.tokenSymbol ?? '').localeCompare(b.tokenSymbol ?? '');
          case 'Amount':
            return (
              m * (parseFloat(a.amountFormatted ?? '0') - parseFloat(b.amountFormatted ?? '0'))
            );
          case 'CHF Value':
            return m * (parseFloat(a.chfValue ?? '0') - parseFloat(b.chfValue ?? '0'));
          case 'Classification':
            return m * a.classification.localeCompare(b.classification);
          default: {
            const tDiff =
              new Date(b.timestamp ?? b.createdAt).getTime() -
              new Date(a.timestamp ?? a.createdAt).getTime();
            if (tDiff !== 0) return m * tDiff;
            const bDiff = (a.blockNumber ?? 0) - (b.blockNumber ?? 0);
            if (bDiff !== 0) return m * bDiff;
            return m * ((a.logIndex ?? 0) - (b.logIndex ?? 0));
          }
        }
      });
  }, [transfers, search, classificationFilters, directionFilters, sortTab, sortReverse]);

  // The tracked address for the selected transfers (for chain info)
  const selectedAddress = addresses.find(a => a.id === selectedId);

  return (
    <>
      <Section>
        <PageHeader
          title="Accounting"
          description="Track token transfers and map them to assets and liabilities for your accountant."
          icon={faScaleBalanced}
        />

        <TrialBalance lines={trialBalance} />

        <div className="print-hidden">
          <AddressManager
            addresses={addresses}
            onAdd={handleAddAddress}
            onSync={handleSync}
            onRemove={handleRemoveAddress}
            syncing={syncing}
          />

          {/* Address tabs */}
          {addresses.length > 1 && (
            <div className="flex gap-2 mb-4 flex-wrap">
              {addresses.map(a => (
                <button
                  key={a.id}
                  onClick={() => handleSelectAddress(a.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    selectedId === a.id
                      ? 'bg-brand text-white'
                      : 'bg-card border border-table-alt text-text-secondary hover:text-brand'
                  }`}
                >
                  {a.label ?? `${a.address.slice(0, 6)}…${a.address.slice(-4)}`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Transfer table */}
        {selectedId && (
          <div className="mb-6 print-hidden">
            <Table>
              <TableHeadSearchable
                headers={TRANSFER_HEADERS}
                colSpan={TRANSFER_HEADERS.length}
                tab={sortTab}
                reverse={sortReverse}
                tabOnChange={handleSort}
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search by token, tx hash, address…"
                hideMyWallet
                inMyWallet={showHidden}
                onInMyWalletChange={v => {
                  setShowHidden(v);
                  if (selectedId) void loadTransfers(selectedId);
                }}
                filterOptionsTitle="Classification"
                filterOptions={[...CLASSIFICATION_FILTER, ...DIRECTION_FILTER]}
                activeFilters={[...classificationFilters, ...directionFilters]}
                onFiltersChange={v => {
                  setClassificationFilters(
                    v.filter(f => ['ASSET', 'LIABILITY', 'SKIPPED', 'UNCLASSIFIED'].includes(f))
                  );
                  setDirectionFilters(v.filter(f => ['IN', 'OUT'].includes(f)));
                }}
              />
              <TableBody>
                {loadingTransfers ? (
                  <TableRowEmpty>Loading transfers…</TableRowEmpty>
                ) : visible.length === 0 ? (
                  <TableRowEmpty>
                    {transfers.length === 0
                      ? 'No transfers yet. Add an address and click Sync.'
                      : 'No transfers match your filter.'}
                  </TableRowEmpty>
                ) : (
                  visible.map(t => {
                    const cls = CLASSIFICATION_STYLE[t.classification];
                    const isIn = t.direction === 'IN';
                    const chainId = selectedAddress?.chainId ?? 1;
                    const counterparty = isIn ? t.fromAddress : (t.toAddress ?? t.fromAddress);
                    const isEditingChf = chfEditing?.id === t.id;

                    return (
                      <TableRow
                        key={t.id}
                        headers={TRANSFER_HEADERS}
                        colSpan={TRANSFER_HEADERS.length}
                        tab={sortTab}
                        rawHeader
                      >
                        {/* Date + tx hash */}
                        <div className="flex flex-col gap-1 text-left">
                          <span className="text-sm">{formatDate(t.timestamp)}</span>
                          <div className="flex items-center gap-1">
                            <AddressDisplay
                              address={t.txHash}
                              prefixLength={6}
                              suffixLength={4}
                              showCopy
                              className="text-xs text-text-muted"
                            />
                            {explorerTxUrl(chainId, t.txHash) && (
                              <a
                                href={explorerTxUrl(chainId, t.txHash)!}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="inline-flex items-center text-text-muted hover:text-brand transition-colors"
                              >
                                <FontAwesomeIcon
                                  icon={faArrowUpRightFromSquare}
                                  className="w-2.5 h-2.5"
                                />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Token + address */}
                        <div className="flex flex-col gap-1 items-end">
                          <span className="font-medium text-sm text-text-primary">
                            {t.tokenSymbol ?? '?'}
                          </span>
                          {t.tokenAddress && (
                            <div className="flex items-center gap-1">
                              <AddressDisplay
                                address={t.tokenAddress}
                                prefixLength={5}
                                suffixLength={4}
                                showCopy
                                className="text-xs text-text-muted"
                              />
                              {explorerTokenUrl(chainId, t.tokenAddress) && (
                                <a
                                  href={explorerTokenUrl(chainId, t.tokenAddress)!}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="text-text-muted hover:text-brand transition-colors"
                                >
                                  <FontAwesomeIcon
                                    icon={faArrowUpRightFromSquare}
                                    className="w-2.5 h-2.5"
                                  />
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Amount */}
                        <div className="text-right">
                          <span
                            className={`text-sm font-medium ${isIn ? 'text-success' : 'text-error'}`}
                          >
                            {isIn ? '+' : '−'}
                            {formatAmount(t.amountFormatted)}
                          </span>
                          <div className="flex justify-end mt-0.5">
                            <Badge
                              text={t.direction}
                              variant="custom"
                              customColor={isIn ? 'text-success' : 'text-error'}
                              customBgColor={isIn ? 'bg-success-bg' : 'bg-error-bg'}
                              size="sm"
                            />
                          </div>
                        </div>

                        {/* CHF Value — editable */}
                        <div className="flex justify-end" onClick={e => e.stopPropagation()}>
                          {isEditingChf ? (
                            <input
                              autoFocus
                              type="text"
                              value={chfEditing.value}
                              onChange={e => setChfEditing({ id: t.id, value: e.target.value })}
                              onBlur={() => handleChfSave(t.id, chfEditing.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleChfSave(t.id, chfEditing.value);
                                if (e.key === 'Escape') setChfEditing(null);
                              }}
                              placeholder="0.00"
                              className="w-24 text-right text-sm bg-transparent border-b border-brand outline-none text-text-primary"
                            />
                          ) : (
                            <button
                              onClick={() => setChfEditing({ id: t.id, value: t.chfValue ?? '' })}
                              className="text-sm min-w-[4rem] text-right"
                            >
                              {chfSaving === t.id ? (
                                <span className="text-text-muted text-xs">Saving…</span>
                              ) : t.chfValue ? (
                                <span className="text-text-primary font-medium">
                                  CHF {formatAmount(t.chfValue)}
                                </span>
                              ) : (
                                <span className="text-text-muted text-xs italic hover:text-brand transition-colors">
                                  + CHF
                                </span>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Counterparty */}
                        <div className="flex flex-col gap-1 items-end">
                          <div className="flex items-center gap-1">
                            <AddressDisplay
                              address={counterparty}
                              prefixLength={6}
                              suffixLength={4}
                              showCopy
                              className="text-xs text-text-muted"
                            />
                            {explorerAddrUrl(chainId, counterparty) && (
                              <a
                                href={explorerAddrUrl(chainId, counterparty)!}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="inline-flex items-center text-text-muted hover:text-brand transition-colors"
                              >
                                <FontAwesomeIcon
                                  icon={faArrowUpRightFromSquare}
                                  className="w-2.5 h-2.5"
                                />
                              </a>
                            )}
                          </div>
                          <span className="text-xs text-text-muted">
                            {isIn ? 'sender' : 'recipient'}
                          </span>
                        </div>

                        {/* Classification + hide */}
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={e => e.stopPropagation()}
                        >
                          <select
                            value={t.classification}
                            onChange={e =>
                              handleUpdateTransfer(t.id, { classification: e.target.value })
                            }
                            className={`text-xs rounded-lg px-2 py-1 border-transparent outline-none cursor-pointer ${cls.bg} ${cls.color}`}
                          >
                            {CLASSIFICATION_OPTIONS.map(o => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleUpdateTransfer(t.id, { isHidden: !t.isHidden })}
                            title={t.isHidden ? 'Show' : 'Hide'}
                            className="text-text-muted hover:text-brand transition-colors"
                          >
                            <FontAwesomeIcon
                              icon={t.isHidden ? faEye : faEyeSlash}
                              className="w-3.5 h-3.5"
                            />
                          </button>
                        </div>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            {total > visible.length && (
              <p className="text-center text-xs text-text-muted mt-2">
                Showing {visible.length} of {total} transfers
              </p>
            )}
          </div>
        )}

        <div className="mt-2 print-hidden space-y-3">
          <AccountsPanel
            accounts={accounts}
            onRefresh={async () => {
              await loadAccounts();
              await loadTemplates();
            }}
          />
          <TemplatesPanel templates={templates} accounts={accounts} onRefresh={loadTemplates} />
          <BlacklistPanel
            blacklist={blacklist}
            onAdd={handleAddBlacklist}
            onRemove={handleRemoveBlacklist}
          />
        </div>
      </Section>
    </>
  );
}
