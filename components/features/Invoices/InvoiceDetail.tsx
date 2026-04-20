import { useState } from 'react';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Modal, DetailRow } from '@/components/ui/Modal';
import { Badge } from '@/components/ui';
import { ButtonInput, TextInput } from '@/components/ui/Input';
import { TagList } from '@/components/ui/TagList';
import { AddressDisplay } from '@/components/ui/AddressDisplay';
import type { Invoice } from './types';

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  PAID:             { color: 'text-success',     bg: 'bg-success-bg' },
  AWAITING_PAYMENT: { color: 'text-warning',     bg: 'bg-warning/10' },
  FAILED:           { color: 'text-error',       bg: 'bg-error-bg' },
  PROCESSING:       { color: 'text-info',        bg: 'bg-info/10' },
  PENDING:          { color: 'text-text-muted',  bg: 'bg-surface' },
  EXTRACTED:        { color: 'text-text-muted',  bg: 'bg-surface' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface Props {
  invoice: Invoice;
  isAdmin: boolean;
  onClose: () => void;
  onMarkPaid: (id: string, txHash: string) => Promise<boolean>;
}

export default function InvoiceDetail({ invoice, isAdmin, onClose, onMarkPaid }: Props) {
  const [txHash, setTxHash] = useState('');
  const [marking, setMarking] = useState(false);

  const sc = STATUS_STYLE[invoice.status] ?? { color: 'text-text-muted', bg: 'bg-surface' };
  const canMarkPaid = isAdmin && invoice.status !== 'PAID' && invoice.status !== 'PENDING' && invoice.status !== 'PROCESSING';

  const handleMarkPaid = async () => {
    if (!txHash.trim()) return;
    setMarking(true);
    const ok = await onMarkPaid(invoice.id, txHash.trim());
    setMarking(false);
    if (ok) onClose();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Invoice Detail"
      size="md"
      footer={
        <ButtonInput
          label="Close"
          variant="secondary"
          onClick={onClose}
        />
      }
    >
      <div className="space-y-3 text-sm">
        <DetailRow label="File" value={invoice.fileName} />
        <DetailRow label="Uploaded" value={formatDate(invoice.createdAt)} />
        <DetailRow label="Status">
          <Badge
            text={invoice.status.replace(/_/g, ' ')}
            variant="custom"
            customColor={sc.color}
            customBgColor={sc.bg}
            size="sm"
          />
        </DetailRow>

        {(invoice.status === 'PENDING' || invoice.status === 'PROCESSING') && (
          <p className="text-xs text-text-muted italic">
            AI extraction in progress — this page will update automatically.
          </p>
        )}

        {invoice.fromName && <DetailRow label="From" value={invoice.fromName} />}
        {invoice.toName && <DetailRow label="To" value={invoice.toName} />}
        {invoice.amount && invoice.currency && (
          <DetailRow label="Amount" value={`${invoice.amount} ${invoice.currency}`} />
        )}
        {invoice.reference && <DetailRow label="Reference" value={invoice.reference} mono />}
        {invoice.itemTags.length > 0 && (
          <DetailRow label="Items">
            <TagList tags={invoice.itemTags} />
          </DetailRow>
        )}

        {(invoice.bankHolder || invoice.bankIban) && (
          <div className="pt-3 border-t border-input-border space-y-2">
            {invoice.bankHolder   && <DetailRow label="Bank holder" value={invoice.bankHolder} />}
            {(invoice.bankStreet || invoice.bankStreetNr) && (
              <DetailRow label="Address" value={`${invoice.bankStreet ?? ''} ${invoice.bankStreetNr ?? ''}`.trim()} />
            )}
            {(invoice.bankZip || invoice.bankCity) && (
              <DetailRow label="City" value={`${invoice.bankZip ?? ''} ${invoice.bankCity ?? ''}`.trim()} />
            )}
            {invoice.bankIban     && <DetailRow label="IBAN" value={invoice.bankIban} mono />}
          </div>
        )}

        {invoice.safeAddress && (
          <DetailRow label="Pay to">
            <AddressDisplay address={invoice.safeAddress} />
          </DetailRow>
        )}

        {invoice.paidTxHash && (
          <DetailRow label="Paid tx" value={invoice.paidTxHash} mono />
        )}
        {invoice.paidAt && (
          <DetailRow label="Paid at" value={formatDate(invoice.paidAt)} />
        )}
        {invoice.error && (
          <DetailRow label="Error">
            <span className="text-error break-all">{invoice.error}</span>
          </DetailRow>
        )}

        {canMarkPaid && (
          <div className="pt-3 border-t border-input-border space-y-3">
            <TextInput
              label="Payment Tx Hash"
              value={txHash}
              onChange={setTxHash}
              placeholder="0x…"
              note="On-chain transaction hash confirming payment"
            />
            <ButtonInput
              label={marking ? 'Saving…' : 'Mark as paid'}
              variant="primary"
              size="sm"
              loading={marking}
              disabled={marking || !txHash.trim()}
              icon={<FontAwesomeIcon icon={faCheck} />}
              onClick={handleMarkPaid}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
