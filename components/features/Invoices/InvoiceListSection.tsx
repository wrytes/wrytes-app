import { useState, useMemo } from 'react';
import { faFileInvoice } from '@fortawesome/free-solid-svg-icons';
import { PageHeader, Section } from '@/components/ui/Layout';
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
import { useInvoices } from '@/hooks/invoices/useInvoices';
import InvoiceUpload from './InvoiceUpload';
import InvoiceDetail from './InvoiceDetail';
import type { Invoice } from './types';

const HEADERS = ['Date', 'From', 'Amount', 'Tags', 'Status'];

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  PAID: { color: 'text-success', bg: 'bg-success-bg' },
  AWAITING_PAYMENT: { color: 'text-warning', bg: 'bg-warning/10' },
  FAILED: { color: 'text-error', bg: 'bg-error-bg' },
  PROCESSING: { color: 'text-info', bg: 'bg-info/10' },
  PENDING: { color: 'text-text-muted', bg: 'bg-surface' },
  EXTRACTED: { color: 'text-text-muted', bg: 'bg-surface' },
};

const STATUS_FILTER_OPTIONS = [
  { label: 'Paid', value: 'PAID' },
  { label: 'Awaiting Payment', value: 'AWAITING_PAYMENT' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Extracted', value: 'EXTRACTED' },
  { label: 'Failed', value: 'FAILED' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
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

export default function InvoiceListSection({ isAdmin }: Props) {
  // isAdmin used only in InvoiceDetail (mark-paid action)
  const { invoices, loading, upload, updateField, markPaid } = useInvoices();
  const { sortTab, sortReverse, handleSort } = useSort('Date');
  const [selected, setSelected] = useState<Invoice | null>(null);
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

    return [...invoices]
      .filter(inv => {
        if (activeStatuses.length > 0 && !activeStatuses.includes(inv.status)) return false;
        if (!q) return true;
        return (
          (inv.fromName ?? '').toLowerCase().includes(q) ||
          (inv.reference ?? '').toLowerCase().includes(q) ||
          (inv.amount ?? '').toLowerCase().includes(q) ||
          (inv.currency ?? '').toLowerCase().includes(q) ||
          inv.itemTags.some(t => t.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        const m = sortReverse ? -1 : 1;
        switch (sortTab) {
          case 'From':
            return m * (a.fromName ?? '').localeCompare(b.fromName ?? '');
          case 'Amount':
            return m * (Number(a.amount ?? 0) - Number(b.amount ?? 0));
          case 'Status':
            return m * a.status.localeCompare(b.status);
          default:
            return m * (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
      });
  }, [invoices, search, activeStatuses, sortTab, sortReverse]);

  return (
    <>
      <Section>
        <PageHeader
          title="Invoices"
          description="Upload invoice documents — AI extracts the details and assigns a payment address."
          icon={faFileInvoice}
        />

        <div className="mb-6">
          <InvoiceUpload onUpload={handleUpload} />
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
            searchPlaceholder="Search invoices…"
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
                {invoices.length === 0
                  ? 'No invoices yet. Upload one above.'
                  : 'No invoices match your search.'}
              </TableRowEmpty>
            ) : (
              visible.map(inv => {
                const sc = STATUS_STYLE[inv.status] ?? {
                  color: 'text-text-muted',
                  bg: 'bg-surface',
                };
                return (
                  <TableRow
                    key={inv.id}
                    headers={HEADERS}
                    colSpan={HEADERS.length}
                    tab={sortTab}
                    rawHeader
                    onClick={() => setSelected(inv)}
                  >
                    {/* Date + reference */}
                    <div className="flex flex-col gap-0.5 md:text-left max-md:text-right">
                      <span className="text-sm">{formatDate(inv.createdAt)}</span>
                      {inv.reference && (
                        <span className="text-xs text-text-muted">{inv.reference}</span>
                      )}
                    </div>

                    {/* From — editable */}
                    <div onClick={e => e.stopPropagation()}>
                      <EditableCell
                        value={inv.fromName}
                        isEditing={isEditing(inv.id, 'fromName')}
                        editValue={
                          isEditing(inv.id, 'fromName') ? editState!.value : (inv.fromName ?? '')
                        }
                        onEdit={() => startEdit(inv.id, 'fromName', inv.fromName ?? '')}
                        onChange={v => setEditState(s => (s ? { ...s, value: v } : s))}
                        onSave={saveEdit}
                        onCancel={cancelEdit}
                        placeholder="Sender name"
                        emptyText="Add sender"
                      />
                    </div>

                    {/* Amount — editable (number only, currency shown as suffix) */}
                    <div onClick={e => e.stopPropagation()}>
                      {isEditing(inv.id, 'amount') ? (
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
                          value={inv.amount ? `${inv.amount}${inv.currency ? ` ${inv.currency}` : ''}` : null}
                          isEditing={false}
                          editValue={inv.amount ?? ''}
                          onEdit={() => setEditState({ id: inv.id, field: 'amount', value: inv.amount ?? '', currency: inv.currency ?? '' })}
                          onChange={() => {}}
                          onSave={saveEdit}
                          onCancel={cancelEdit}
                          placeholder="0.00"
                          emptyText="Add amount"
                        />
                      )}
                    </div>

                    {/* Items — comma-separated edit, plain list display */}
                    <div className="pl-4 max-w-64" onClick={e => e.stopPropagation()}>
                      {isEditing(inv.id, 'itemTags') ? (
                        <EditableCell
                          value={inv.itemTags.join(', ')}
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
                          onClick={() => startEdit(inv.id, 'itemTags', inv.itemTags.join(', '))}
                          className="group flex w-full items-center justify-end"
                        >
                          {inv.itemTags.length > 0 ? (
                            <TagList tags={inv.itemTags.slice(0, 4)} />
                          ) : (
                            <span className="text-text-muted text-sm italic group-hover:text-brand transition-colors">
                              Add items
                            </span>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex justify-end">
                      <Badge
                        text={inv.status.replace(/_/g, ' ')}
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
      </Section>

      {selected && (
        <InvoiceDetail
          invoice={selected}
          isAdmin={isAdmin}
          onClose={() => setSelected(null)}
          onMarkPaid={async (id, txHash) => {
            const ok = await markPaid(id, txHash);
            if (ok)
              setSelected(prev => (prev ? { ...prev, status: 'PAID', paidTxHash: txHash } : null));
            return ok;
          }}
        />
      )}
    </>
  );
}
