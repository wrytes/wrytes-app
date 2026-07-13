import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui';
import { Table, TableBody, TableHead, TableRow, TableRowEmpty } from '@/components/ui/Table';
import { useSort } from '@/hooks/useSort';
import { useInvoices } from '@/hooks/invoices/useInvoices';
import InvoiceCreateModal from './InvoiceCreateModal';
import InvoiceDetailModal from './InvoiceDetailModal';
import type { Invoice } from './types';

const HEADERS = ['Number', 'Recipient', 'Total', 'Due', 'Status'];

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  DRAFT: { color: 'text-text-muted', bg: 'bg-surface' },
  SENT: { color: 'text-info', bg: 'bg-info/10' },
  PAID: { color: 'text-success', bg: 'bg-success-bg' },
  CANCELLED: { color: 'text-error', bg: 'bg-error-bg' },
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-CH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTotal(amount: string, currency: string) {
  return `${currency} ${Number(amount).toLocaleString('en-CH', { minimumFractionDigits: 2 })}`;
}

interface Props {
  creating?: boolean;
  onCloseCreate?: () => void;
}

export default function InvoiceListSection({ creating = false, onCloseCreate }: Props) {
  const { invoices, loading, create, send, markPaid, cancel } = useInvoices();
  const { sortTab, sortReverse, handleSort } = useSort('Number');
  const [selected, setSelected] = useState<Invoice | null>(null);

  const visible = useMemo(() => {
    return [...invoices].sort((a, b) => {
      const m = sortReverse ? -1 : 1;
      switch (sortTab) {
        case 'Recipient':
          return m * a.recipientName.localeCompare(b.recipientName);
        case 'Total':
          return m * (Number(a.total) - Number(b.total));
        case 'Due':
          return m * (a.dueDate ?? '').localeCompare(b.dueDate ?? '');
        case 'Status':
          return m * a.status.localeCompare(b.status);
        default:
          return m * a.number.localeCompare(b.number);
      }
    });
  }, [invoices, sortTab, sortReverse]);

  return (
    <>
      <Table>
        <TableHead
          headers={HEADERS}
          colSpan={HEADERS.length}
          tab={sortTab}
          reverse={sortReverse}
          tabOnChange={handleSort}
        />
        <TableBody>
          {loading ? (
            <TableRowEmpty>Loading…</TableRowEmpty>
          ) : visible.length === 0 ? (
            <TableRowEmpty>No invoices yet. Create one to get started.</TableRowEmpty>
          ) : (
            visible.map(inv => {
              const sc = STATUS_STYLE[inv.status] ?? { color: 'text-text-muted', bg: 'bg-surface' };
              return (
                <TableRow
                  key={inv.id}
                  headers={HEADERS}
                  colSpan={HEADERS.length}
                  tab={sortTab}
                  onClick={() => setSelected(inv)}
                >
                  <div className="text-sm font-medium text-text-primary text-left">
                    {inv.number}
                  </div>
                  <div className="text-sm text-text-secondary">
                    <div>{inv.recipientName}</div>
                    {inv.recipientEmail && (
                      <div className="text-xs text-text-muted">{inv.recipientEmail}</div>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-text-primary tabular-nums">
                    {formatTotal(inv.total, inv.currency)}
                  </div>
                  <div className="text-sm text-text-secondary">{formatDate(inv.dueDate)}</div>
                  <div className="flex justify-end">
                    <Badge
                      text={inv.status}
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

      {creating && (
        <InvoiceCreateModal
          onClose={() => onCloseCreate?.()}
          onCreated={() => onCloseCreate?.()}
          onCreate={create}
        />
      )}

      {selected && (
        <InvoiceDetailModal
          invoice={selected}
          onClose={() => setSelected(null)}
          onSend={async id => {
            const ok = await send(id);
            if (ok) setSelected(prev => (prev ? { ...prev, status: 'SENT' } : null));
            return ok;
          }}
          onMarkPaid={async id => {
            const ok = await markPaid(id);
            if (ok) setSelected(prev => (prev ? { ...prev, status: 'PAID' } : null));
            return ok;
          }}
          onCancel={async id => {
            const ok = await cancel(id);
            if (ok) setSelected(prev => (prev ? { ...prev, status: 'CANCELLED' } : null));
            return ok;
          }}
        />
      )}
    </>
  );
}
