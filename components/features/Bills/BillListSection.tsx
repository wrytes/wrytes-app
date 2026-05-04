import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui';
import {
  Table,
  TableBody,
  TableHeadSearchable,
  TableRow,
  TableRowEmpty,
  EditableCell,
} from '@/components/ui/Table';
import { TagList } from '@/components/ui/TagList';
import { useSort } from '@/hooks/useSort';
import { useBills } from '@/hooks/bills/useBills';
import BillUpload from './BillUpload';
import BillDetail from './BillDetail';
import type { Bill } from './types';

const HEADERS = ['Date', 'From', 'Amount', 'Tags', 'Status'];

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  PAID:             { color: 'text-success',    bg: 'bg-success-bg' },
  AWAITING_PAYMENT: { color: 'text-warning',    bg: 'bg-warning/10' },
  FAILED:           { color: 'text-error',      bg: 'bg-error-bg' },
  PROCESSING:       { color: 'text-info',       bg: 'bg-info/10' },
  PENDING:          { color: 'text-text-muted', bg: 'bg-surface' },
  EXTRACTED:        { color: 'text-text-muted', bg: 'bg-surface' },
};

const STATUS_FILTER_OPTIONS = [
  { label: 'Paid',             value: 'PAID' },
  { label: 'Awaiting Payment', value: 'AWAITING_PAYMENT' },
  { label: 'Processing',       value: 'PROCESSING' },
  { label: 'Pending',          value: 'PENDING' },
  { label: 'Extracted',        value: 'EXTRACTED' },
  { label: 'Failed',           value: 'FAILED' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CH', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

type EditKey = 'fromName' | 'amount' | 'itemTags';
interface EditState {
  id: string;
  field: EditKey;
  value: string;
  currency?: string;
}

interface Props {
  isAdmin: boolean;
}

export default function BillListSection({ isAdmin }: Props) {
  const { bills, loading, upload, updateField, markPaid } = useBills();
  const { sortTab, sortReverse, handleSort } = useSort('Date');
  const [selected, setSelected] = useState<Bill | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [search, setSearch] = useState('');
  const [activeStatuses, setActiveStatuses] = useState<string[]>([]);

  const handleUpload = async (files: File[]) => {
    await Promise.all(files.map(f => upload(f)));
  };

  const startEdit = (id: string, field: EditKey, current: string) =>
    setEditState({ id, field, value: current });
  const cancelEdit = () => setEditState(null);

  const saveEdit = () => {
    if (!editState) return;
    const { id, field, value, currency } = editState;
    let payload: Parameters<typeof updateField>[1];
    if (field === 'itemTags') {
      payload = { itemTags: value.split(',').map(t => t.trim()).filter(Boolean) };
    } else if (field === 'amount') {
      payload = { amount: value || null, currency: currency ?? null };
    } else {
      payload = { [field]: value || null };
    }
    void updateField(id, payload);
    setEditState(null);
  };

  const isEditing = (id: string, field: EditKey) =>
    editState?.id === id && editState?.field === field;

  const visible = useMemo(() => {
    const q = search.toLowerCase().trim();
    return [...bills]
      .filter(b => {
        if (activeStatuses.length > 0 && !activeStatuses.includes(b.status)) return false;
        if (!q) return true;
        return (
          (b.fromName ?? '').toLowerCase().includes(q) ||
          (b.reference ?? '').toLowerCase().includes(q) ||
          (b.amount ?? '').toLowerCase().includes(q) ||
          (b.currency ?? '').toLowerCase().includes(q) ||
          b.itemTags.some(t => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        const m = sortReverse ? -1 : 1;
        switch (sortTab) {
          case 'From':   return m * (a.fromName ?? '').localeCompare(b.fromName ?? '');
          case 'Amount': return m * (Number(a.amount ?? 0) - Number(b.amount ?? 0));
          case 'Status': return m * a.status.localeCompare(b.status);
          default:       return m * (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
      });
  }, [bills, search, activeStatuses, sortTab, sortReverse]);

  return (
    <>
      <div className="mb-6">
        <BillUpload onUpload={handleUpload} />
      </div>

      <Table>
          <TableHeadSearchable
            headers={HEADERS}
            colSpan={HEADERS.length}
            tab={sortTab}
            reverse={sortReverse}
            tabOnChange={handleSort}
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search bills…"
            hideMyWallet
            inMyWallet={false}
            onInMyWalletChange={() => {}}
            filterOptionsTitle="Status"
            filterOptions={STATUS_FILTER_OPTIONS}
            activeFilters={activeStatuses}
            onFiltersChange={setActiveStatuses}
          />
          <TableBody>
            {loading ? (
              <TableRowEmpty>Loading…</TableRowEmpty>
            ) : visible.length === 0 ? (
              <TableRowEmpty>
                {bills.length === 0 ? 'No bills yet. Upload one above.' : 'No bills match your search.'}
              </TableRowEmpty>
            ) : (
              visible.map(bill => {
                const sc = STATUS_STYLE[bill.status] ?? { color: 'text-text-muted', bg: 'bg-surface' };
                return (
                  <TableRow
                    key={bill.id}
                    headers={HEADERS}
                    colSpan={HEADERS.length}
                    tab={sortTab}
                    rawHeader
                    onClick={() => setSelected(bill)}
                  >
                    <div className="flex flex-col gap-0.5 md:text-left max-md:text-right">
                      <span className="text-sm">{formatDate(bill.createdAt)}</span>
                      {bill.reference && (
                        <span className="text-xs text-text-muted">{bill.reference}</span>
                      )}
                    </div>

                    <div onClick={e => e.stopPropagation()}>
                      <EditableCell
                        value={bill.fromName}
                        isEditing={isEditing(bill.id, 'fromName')}
                        editValue={isEditing(bill.id, 'fromName') ? editState!.value : (bill.fromName ?? '')}
                        onEdit={() => startEdit(bill.id, 'fromName', bill.fromName ?? '')}
                        onChange={v => setEditState(s => (s ? { ...s, value: v } : s))}
                        onSave={saveEdit}
                        onCancel={cancelEdit}
                        placeholder="Sender name"
                        emptyText="Add sender"
                      />
                    </div>

                    <div onClick={e => e.stopPropagation()}>
                      {isEditing(bill.id, 'amount') ? (
                        <div className="flex items-center gap-1 justify-end" onClick={e => e.stopPropagation()}>
                          <input
                            autoFocus
                            type="text"
                            value={editState!.value}
                            onChange={e => setEditState(s => s ? { ...s, value: e.target.value } : s)}
                            onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                            placeholder="0.00"
                            maxLength={20}
                            className="w-24 text-right text-sm bg-transparent border-b border-brand outline-none text-text-primary"
                          />
                          <input
                            type="text"
                            value={editState!.currency ?? ''}
                            onChange={e => setEditState(s => s ? { ...s, currency: e.target.value.toUpperCase() } : s)}
                            onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                            placeholder="CHF"
                            maxLength={5}
                            className="w-12 text-right text-sm bg-transparent border-b border-brand outline-none text-text-muted uppercase"
                          />
                        </div>
                      ) : (
                        <EditableCell
                          value={bill.amount ? `${bill.amount}${bill.currency ? ` ${bill.currency}` : ''}` : null}
                          isEditing={false}
                          editValue={bill.amount ?? ''}
                          onEdit={() => setEditState({ id: bill.id, field: 'amount', value: bill.amount ?? '', currency: bill.currency ?? '' })}
                          onChange={() => {}}
                          onSave={saveEdit}
                          onCancel={cancelEdit}
                          placeholder="0.00"
                          emptyText="Add amount"
                        />
                      )}
                    </div>

                    <div className="pl-4 max-w-64" onClick={e => e.stopPropagation()}>
                      {isEditing(bill.id, 'itemTags') ? (
                        <EditableCell
                          value={bill.itemTags.join(', ')}
                          isEditing
                          editValue={editState!.value}
                          onEdit={() => {}}
                          onChange={v => setEditState(s => (s ? { ...s, value: v } : s))}
                          onSave={saveEdit}
                          onCancel={cancelEdit}
                          placeholder="tag1, tag2, tag3"
                          maxLength={200}
                        />
                      ) : (
                        <button
                          onClick={() => startEdit(bill.id, 'itemTags', bill.itemTags.join(', '))}
                          className="group flex w-full items-center justify-end"
                        >
                          {bill.itemTags.length > 0 ? (
                            <TagList tags={bill.itemTags.slice(0, 4)} />
                          ) : (
                            <span className="text-text-muted text-sm italic group-hover:text-brand transition-colors">
                              Add items
                            </span>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <Badge
                        text={bill.status.replace(/_/g, ' ')}
                        variant="custom"
                        customColor={sc.color}
                        customBgColor={sc.bg}
                        size="sm"
                      />
                    </div>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

      {selected && (
        <BillDetail
          bill={selected}
          isAdmin={isAdmin}
          onClose={() => setSelected(null)}
          onMarkPaid={async (id, txHash) => {
            const ok = await markPaid(id, txHash);
            if (ok) setSelected(prev => (prev ? { ...prev, status: 'PAID', paidTxHash: txHash } : null));
            return ok;
          }}
        />
      )}
    </>
  );
}
