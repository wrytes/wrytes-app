import { useState, useCallback, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faPencil, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Table, TableBody, TableHead, TableHeadSearchable, TableRow, TableRowEmpty } from '@/components/ui/Table';
import { apiRequest } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format-handling';
import { useSort } from '@/hooks/useSort';
import { useAddressColors } from '@/hooks/redux/useAddressColors';
import { ADDRESS_COLOR_CLASSES } from './addressColors';
import type { Adjustment, AdjustmentType, WalletAddress } from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TYPE_OPTIONS: { label: string; value: AdjustmentType; hint: string; color: string; bg: string }[] = [
  { label: 'Asset Income',     value: 'PROFIT',    hint: 'asset +',     color: 'text-success', bg: 'bg-success-bg' },
  { label: 'Asset Expense',    value: 'LOSS',      hint: 'asset −',     color: 'text-error',   bg: 'bg-error-bg'   },
  { label: 'Liability Income', value: 'BORROW',    hint: 'liability +', color: 'text-info',    bg: 'bg-info/10'    },
  { label: 'Liability Expense',value: 'REPAYMENT', hint: 'liability −', color: 'text-brand',   bg: 'bg-brand/10'   },
];

const HEADERS = ['Date', 'Type', 'Token', 'Amount', 'CHF Value', 'Note', 'Address', ''];

function typeStyle(type: AdjustmentType) {
  return TYPE_OPTIONS.find(o => o.value === type) ?? TYPE_OPTIONS[2];
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtNum(n: string | null) {
  if (!n) return '—';
  const v = parseFloat(n);
  return isNaN(v) ? '—' : (formatCurrency(v, 6, 6) ?? '—');
}

function fmtChf(n: string | null) {
  if (!n) return '—';
  const v = parseFloat(n);
  return isNaN(v) ? '—' : (formatCurrency(v, 0, 2) ?? '—');
}

function addressLabel(a: WalletAddress | undefined) {
  if (!a) return '—';
  return a.label ?? `${a.address.slice(0, 6)}…${a.address.slice(-4)}`;
}

// ---------------------------------------------------------------------------
// Row (view + inline edit)
// ---------------------------------------------------------------------------

interface RowProps {
  adj: Adjustment;
  onSave: (id: string, patch: Partial<Omit<Adjustment, 'id' | 'accountingAddressId' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isExporting?: boolean;
  address?: WalletAddress;
}

function AdjustmentRow({ adj, onSave, onDelete, isExporting = false, address }: RowProps) {
  const { colorFor } = useAddressColors();
  const addressBadgeClasses = address
    ? `${ADDRESS_COLOR_CLASSES[colorFor(address.id)].bg} ${ADDRESS_COLOR_CLASSES[colorFor(address.id)].text} ${ADDRESS_COLOR_CLASSES[colorFor(address.id)].border}`
    : 'bg-surface border-table-alt text-text-secondary';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    date: adj.date.slice(0, 10),
    type: adj.type,
    tokenSymbol: adj.tokenSymbol ?? '',
    amount: adj.amount ?? '',
    chfValue: adj.chfValue ?? '',
    note: adj.note ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(adj.id, {
        date: draft.date,
        type: draft.type as AdjustmentType,
        tokenSymbol: draft.tokenSymbol || null,
        amount: draft.amount || null,
        chfValue: draft.chfValue || null,
        note: draft.note || null,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft({
      date: adj.date.slice(0, 10),
      type: adj.type,
      tokenSymbol: adj.tokenSymbol ?? '',
      amount: adj.amount ?? '',
      chfValue: adj.chfValue ?? '',
      note: adj.note ?? '',
    });
    setEditing(false);
  };

  const style = typeStyle(adj.type);

  if (editing) {
    return (
      <TableRow headers={HEADERS} colSpan={HEADERS.length} rawHeader>
        {/* Date */}
        <input
          type="date"
          value={draft.date}
          onChange={e => setDraft(d => ({ ...d, date: e.target.value }))}
          className="w-full bg-transparent border border-brand rounded px-2 py-1 text-sm text-text-primary outline-none"
        />
        {/* Type */}
        <select
          value={draft.type}
          onChange={e => setDraft(d => ({ ...d, type: e.target.value as AdjustmentType }))}
          className="text-xs rounded-lg px-2 py-1 border border-brand outline-none bg-card text-text-primary"
        >
          {TYPE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {/* Token */}
        <input
          type="text"
          value={draft.tokenSymbol}
          onChange={e => setDraft(d => ({ ...d, tokenSymbol: e.target.value }))}
          placeholder="e.g. BTC"
          className="w-full bg-transparent border border-table-alt rounded px-2 py-1 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand"
        />
        {/* Amount */}
        <input
          type="text"
          value={draft.amount}
          onChange={e => setDraft(d => ({ ...d, amount: e.target.value }))}
          placeholder="0.00"
          className="w-full bg-transparent border border-table-alt rounded px-2 py-1 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand tabular-nums"
        />
        {/* CHF */}
        <input
          type="text"
          value={draft.chfValue}
          onChange={e => setDraft(d => ({ ...d, chfValue: e.target.value }))}
          placeholder="0.00"
          className="w-full bg-transparent border border-table-alt rounded px-2 py-1 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand tabular-nums"
        />
        {/* Note */}
        <input
          type="text"
          value={draft.note}
          onChange={e => setDraft(d => ({ ...d, note: e.target.value }))}
          placeholder="Note…"
          className="w-full bg-transparent border border-table-alt rounded px-2 py-1 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand"
        />
        {/* Address (fixed — not editable) */}
        <span className={`text-xs border rounded-lg px-1.5 py-0.5 truncate inline-block ${addressBadgeClasses}`}>
          {addressLabel(address)}
        </span>
        {/* Actions */}
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-success hover:text-success/80 transition-colors p-1 disabled:opacity-50"
            title="Save"
          >
            <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCancel}
            className="text-text-muted hover:text-text-secondary transition-colors p-1"
            title="Cancel"
          >
            <FontAwesomeIcon icon={faTimes} className="w-3.5 h-3.5" />
          </button>
        </div>
      </TableRow>
    );
  }

  return (
    <TableRow headers={HEADERS} colSpan={HEADERS.length} rawHeader>
      {/* Date */}
      <span className="text-sm text-text-secondary text-left block">{fmtDate(adj.date)}</span>

      {/* Type */}
      {isExporting ? (
        <span className={`text-xs font-semibold ${style.color}`}>{style.label}</span>
      ) : (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-lg ${style.bg} ${style.color}`}>
          {style.label}
        </span>
      )}

      {/* Token */}
      <span className="text-sm font-medium text-text-primary">{adj.tokenSymbol ?? '—'}</span>

      {/* Amount */}
      <span className="text-sm tabular-nums text-text-secondary">{fmtNum(adj.amount)}</span>

      {/* CHF */}
      <span className="text-sm tabular-nums text-text-secondary">
        {adj.chfValue ? `CHF ${fmtChf(adj.chfValue)}` : '—'}
      </span>

      {/* Note */}
      <span className="text-sm text-text-secondary">{adj.note ?? '—'}</span>

      {/* Address */}
      <span className={`text-xs border rounded-lg px-1.5 py-0.5 truncate inline-block ${addressBadgeClasses}`}>
        {addressLabel(address)}
      </span>

      {/* Actions */}
      <div className={`flex items-center justify-end gap-1.5 ${isExporting ? 'invisible' : ''}`}>
        <button
          onClick={() => setEditing(true)}
          className="text-text-muted hover:text-brand transition-colors p-1"
          title="Edit"
        >
          <FontAwesomeIcon icon={faPencil} className="w-3 h-3" />
        </button>
        <button
          onClick={() => onDelete(adj.id)}
          className="text-text-muted hover:text-error transition-colors p-1"
          title="Delete"
        >
          <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
        </button>
      </div>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Add row
// ---------------------------------------------------------------------------

interface AddRowProps {
  onAdd: (entry: { date: string; type: AdjustmentType; tokenSymbol: string | null; amount: string | null; chfValue: string | null; note: string | null; addressId: string }) => Promise<void>;
  onCancel: () => void;
  initialToken?: string;
  addresses: WalletAddress[];
}

function AddRow({ onAdd, onCancel, initialToken = '', addresses }: AddRowProps) {
  const [draft, setDraft] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: 'PROFIT' as AdjustmentType,
    tokenSymbol: initialToken,
    amount: '',
    chfValue: '',
    note: '',
    addressId: addresses[0]?.id ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!draft.addressId) return;
    setSaving(true);
    try {
      await onAdd({
        date: draft.date,
        type: draft.type,
        tokenSymbol: draft.tokenSymbol || null,
        amount: draft.amount || null,
        chfValue: draft.chfValue || null,
        note: draft.note || null,
        addressId: draft.addressId,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <TableRow headers={HEADERS} colSpan={HEADERS.length} rawHeader>
      <input
        type="date"
        value={draft.date}
        onChange={e => setDraft(d => ({ ...d, date: e.target.value }))}
        className="w-full bg-transparent border border-brand rounded px-2 py-1 text-sm text-text-primary outline-none"
      />
      <select
        value={draft.type}
        onChange={e => setDraft(d => ({ ...d, type: e.target.value as AdjustmentType }))}
        className="text-xs rounded-lg px-2 py-1 border border-brand outline-none bg-card text-text-primary"
      >
        {TYPE_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <input
        type="text"
        value={draft.tokenSymbol}
        onChange={e => setDraft(d => ({ ...d, tokenSymbol: e.target.value }))}
        placeholder="e.g. BTC"
        className="w-full bg-transparent border border-table-alt rounded px-2 py-1 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand"
      />
      <input
        type="text"
        value={draft.amount}
        onChange={e => setDraft(d => ({ ...d, amount: e.target.value }))}
        placeholder="0.00"
        className="w-full bg-transparent border border-table-alt rounded px-2 py-1 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand tabular-nums"
      />
      <input
        type="text"
        value={draft.chfValue}
        onChange={e => setDraft(d => ({ ...d, chfValue: e.target.value }))}
        placeholder="0.00"
        className="w-full bg-transparent border border-table-alt rounded px-2 py-1 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand tabular-nums"
      />
      <input
        type="text"
        value={draft.note}
        onChange={e => setDraft(d => ({ ...d, note: e.target.value }))}
        placeholder="Note…"
        className="w-full bg-transparent border border-table-alt rounded px-2 py-1 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-brand"
      />
      <select
        value={draft.addressId}
        onChange={e => setDraft(d => ({ ...d, addressId: e.target.value }))}
        className="text-xs rounded-lg px-2 py-1 border border-brand outline-none bg-card text-text-primary"
      >
        {addresses.map(a => (
          <option key={a.id} value={a.id}>{addressLabel(a)}</option>
        ))}
      </select>
      <div className="flex items-center justify-end gap-1.5">
        <button
          onClick={handleAdd}
          disabled={saving}
          className="text-success hover:text-success/80 transition-colors p-1 disabled:opacity-50"
          title="Add"
        >
          <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onCancel}
          className="text-text-muted hover:text-text-secondary transition-colors p-1"
          title="Cancel"
        >
          <FontAwesomeIcon icon={faTimes} className="w-3.5 h-3.5" />
        </button>
      </div>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// CorrectionsTable — public
// ---------------------------------------------------------------------------

interface Props {
  addressIds: string[];
  addresses: WalletAddress[];
  year: number | null;
  quarter: number | null;
  prefillToken?: string | null;
  onPrefillConsumed?: () => void;
  onMutate?: () => void;
  isExporting?: boolean;
}

export function CorrectionsTable({ addressIds, addresses, year, quarter, prefillToken, onPrefillConsumed, onMutate, isExporting = false }: Props) {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addInitialToken, setAddInitialToken] = useState<string>('');
  // Ordered by selection order so the first-selected address is the default for new entries
  const orderedAddresses = useMemo(
    () => addressIds.map(id => addresses.find(a => a.id === id)).filter((a): a is WalletAddress => !!a),
    [addressIds, addresses]
  );

  // Search / filter / sort
  const { sortTab, sortReverse, handleSort } = useSort('Date');
  const [search, setSearch] = useState('');
  const [typeFilters, setTypeFilters] = useState<string[]>([]);

  useEffect(() => {
    if (prefillToken != null) {
      setAddInitialToken(prefillToken);
      setAdding(true);
      onPrefillConsumed?.();
    }
  }, [prefillToken]);

  const load = useCallback(async () => {
    if (addressIds.length === 0) {
      setAdjustments([]);
      setLoaded(true);
      return;
    }
    const qs = new URLSearchParams();
    if (year) qs.set('year', String(year));
    if (quarter) qs.set('quarter', String(quarter));
    const suffix = qs.toString() ? '?' + qs : '';
    const results = await Promise.all(
      addressIds.map(id => apiRequest<Adjustment[]>(`/accounting/addresses/${id}/adjustments${suffix}`))
    );
    setAdjustments(results.flat());
    setLoaded(true);
  }, [addressIds, year, quarter]);

  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => {
    const q = search.toLowerCase().trim();
    return [...adjustments]
      .filter(a => {
        if (typeFilters.length > 0 && !typeFilters.includes(a.type)) return false;
        if (!q) return true;
        return (
          (a.tokenSymbol ?? '').toLowerCase().includes(q) ||
          (a.note ?? '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const m = sortReverse ? -1 : 1;
        switch (sortTab) {
          case 'Type':    return m * a.type.localeCompare(b.type);
          case 'Token':   return m * (a.tokenSymbol ?? '').localeCompare(b.tokenSymbol ?? '');
          case 'Amount':  return m * (parseFloat(a.amount ?? '0') - parseFloat(b.amount ?? '0'));
          case 'CHF Value': return m * (parseFloat(a.chfValue ?? '0') - parseFloat(b.chfValue ?? '0'));
          default:        return m * (new Date(a.date).getTime() - new Date(b.date).getTime());
        }
      });
  }, [adjustments, search, typeFilters, sortTab, sortReverse]);

  const handleAdd = async (entry: Parameters<AddRowProps['onAdd']>[0]) => {
    const { addressId, ...body } = entry;
    const created = await apiRequest<Adjustment>(`/accounting/addresses/${addressId}/adjustments`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    setAdjustments(prev => [created, ...prev]);
    setAdding(false);
    setAddInitialToken('');
    onMutate?.();
  };

  const handleSave = async (id: string, patch: Parameters<RowProps['onSave']>[1]) => {
    const updated = await apiRequest<Adjustment>(`/accounting/adjustments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    setAdjustments(prev => prev.map(a => (a.id === id ? updated : a)));
    onMutate?.();
  };

  const handleDelete = async (id: string) => {
    await apiRequest(`/accounting/adjustments/${id}`, { method: 'DELETE' });
    setAdjustments(prev => prev.filter(a => a.id !== id));
    onMutate?.();
  };

  // Sortable headers — exclude the empty actions column
  const SORTABLE_HEADERS = HEADERS.slice(0, -1);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Accounting Entries
        </h3>
        {!isExporting && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-xs text-brand border border-brand/30 px-3 py-1.5 rounded-lg hover:bg-brand/10 transition-colors"
          >
            <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
            Add entry
          </button>
        )}
      </div>

      <Table>
        {isExporting ? (
          <TableHead headers={SORTABLE_HEADERS} colSpan={HEADERS.length} />
        ) : (
          <TableHeadSearchable
            headers={SORTABLE_HEADERS}
            colSpan={HEADERS.length}
            tab={sortTab}
            reverse={sortReverse}
            tabOnChange={handleSort}
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by token or note…"
            hideMyWallet
            inMyWallet={false}
            onInMyWalletChange={() => {}}
            filterOptionsTitle="Type"
            filterOptions={TYPE_OPTIONS.map(o => ({ label: o.label, value: o.value }))}
            activeFilters={typeFilters}
            onFiltersChange={setTypeFilters}
          />
        )}
        <TableBody>
          {(() => {
            const rows: React.ReactElement[] = [];
            if (adding) rows.push(
              <AddRow
                key="__add"
                onAdd={handleAdd}
                onCancel={() => { setAdding(false); setAddInitialToken(''); }}
                initialToken={addInitialToken}
                addresses={orderedAddresses}
              />
            );
            if (!loaded) {
              rows.push(<TableRowEmpty key="loading">Loading…</TableRowEmpty>);
            } else if (visible.length === 0 && !adding) {
              rows.push(<TableRowEmpty key="empty">
                {adjustments.length === 0 ? 'No manual entries yet.' : 'No entries match your filter.'}
              </TableRowEmpty>);
            } else {
              visible.forEach(adj =>
                rows.push(
                  <AdjustmentRow
                    key={adj.id}
                    adj={adj}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    isExporting={isExporting}
                    address={addresses.find(a => a.id === adj.accountingAddressId)}
                  />
                )
              );
            }
            return rows;
          })()}
        </TableBody>
      </Table>
    </div>
  );
}
