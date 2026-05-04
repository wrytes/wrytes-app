import { Modal, DetailRow } from '@/components/ui/Modal';
import { Badge } from '@/components/ui';
import { ButtonInput } from '@/components/ui/Input';
import type { Invoice } from './types';

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  DRAFT:     { color: 'text-text-muted', bg: 'bg-surface' },
  SENT:      { color: 'text-info',       bg: 'bg-info/10' },
  PAID:      { color: 'text-success',    bg: 'bg-success-bg' },
  CANCELLED: { color: 'text-error',      bg: 'bg-error-bg' },
};

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-CH', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

function formatTotal(n: string | number) {
  return Number(n).toLocaleString('en-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface Props {
  invoice: Invoice;
  onClose: () => void;
  onSend?: (id: string) => Promise<boolean>;
  onMarkPaid?: (id: string) => Promise<boolean>;
  onCancel?: (id: string) => Promise<boolean>;
}

export default function InvoiceDetailModal({ invoice, onClose, onSend, onMarkPaid, onCancel }: Props) {
  const sc = STATUS_STYLE[invoice.status] ?? { color: 'text-text-muted', bg: 'bg-surface' };

  const actions: Array<{ label: string; variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'error'; onClick: () => void }> = [];

  if (invoice.status === 'DRAFT' && onSend) {
    actions.push({ label: 'Mark as Sent', variant: 'primary', onClick: () => void onSend(invoice.id).then(ok => ok && onClose()) });
  }
  if ((invoice.status === 'DRAFT' || invoice.status === 'SENT') && onMarkPaid) {
    actions.push({ label: 'Mark as Paid', variant: 'outline', onClick: () => void onMarkPaid(invoice.id).then(ok => ok && onClose()) });
  }
  if (invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && onCancel) {
    actions.push({ label: 'Cancel', variant: 'error', onClick: () => void onCancel(invoice.id).then(ok => ok && onClose()) });
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={invoice.number}
      size="md"
      footer={
        <ButtonInput
          label="Close"
          variant="secondary"
          onClick={onClose}
        />
      }
    >
      <div className="space-y-4 text-sm">
        {/* Status */}
        <div className="flex items-center gap-3">
          <Badge
            text={invoice.status}
            variant="custom"
            customColor={sc.color}
            customBgColor={sc.bg}
            size="sm"
          />
          {actions.map(a => (
            <button
              key={a.label}
              onClick={a.onClick}
              className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
                a.variant === 'primary'
                  ? 'bg-brand text-white border-brand hover:bg-opacity-90'
                  : a.variant === 'error'
                  ? 'border-error/40 text-error hover:border-error hover:bg-error-bg'
                  : 'border-table-alt text-text-secondary hover:text-brand hover:border-brand'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>

        {/* Recipient */}
        <div className="space-y-2 pt-2 border-t border-input-border">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Recipient</p>
          <DetailRow label="Name" value={invoice.recipientName} />
          {invoice.recipientEmail && <DetailRow label="Email" value={invoice.recipientEmail} />}
          {invoice.recipientAddress && <DetailRow label="Address" value={invoice.recipientAddress} />}
        </div>

        {/* Dates */}
        <div className="space-y-2 pt-2 border-t border-input-border">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Dates</p>
          <DetailRow label="Issue date" value={formatDate(invoice.issueDate)} />
          {invoice.dueDate && <DetailRow label="Due date" value={formatDate(invoice.dueDate)} />}
        </div>

        {/* Line items */}
        <div className="space-y-2 pt-2 border-t border-input-border">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Items</p>
          <div className="rounded-lg border border-table-alt overflow-hidden">
            <div className="grid grid-cols-[1fr_60px_90px_80px] gap-0 bg-surface px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-table-alt">
              <span>Description</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Unit price</span>
              <span className="text-right">Total</span>
            </div>
            {invoice.items.map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_60px_90px_80px] gap-0 px-3 py-2 border-b border-table-alt/50 last:border-0 text-sm"
              >
                <span className="text-text-primary">{item.description}</span>
                <span className="text-text-secondary text-right tabular-nums">{item.quantity}</span>
                <span className="text-text-secondary text-right tabular-nums">
                  {invoice.currency} {formatTotal(item.unitPrice)}
                </span>
                <span className="text-text-primary text-right font-medium tabular-nums">
                  {invoice.currency} {formatTotal(item.quantity * item.unitPrice)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-between items-center pt-1 border-t border-input-border">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Total</span>
          <span className="text-lg font-bold text-text-primary tabular-nums">
            {invoice.currency} {formatTotal(invoice.total)}
          </span>
        </div>

        {invoice.notes && (
          <div className="pt-2 border-t border-input-border">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Notes</p>
            <p className="text-text-secondary whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
