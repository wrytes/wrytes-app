import { useState } from 'react';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Modal, DetailRow } from '@/components/ui/Modal';
import { Badge } from '@/components/ui';
import { ButtonInput, TextInput } from '@/components/ui/Input';
import { TagList } from '@/components/ui/TagList';
import { AddressDisplay } from '@/components/ui/AddressDisplay';
import type { Bill } from './types';

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  PAID:             { color: 'text-success',    bg: 'bg-success-bg' },
  AWAITING_PAYMENT: { color: 'text-warning',    bg: 'bg-warning/10' },
  FAILED:           { color: 'text-error',      bg: 'bg-error-bg' },
  PROCESSING:       { color: 'text-info',       bg: 'bg-info/10' },
  PENDING:          { color: 'text-text-muted', bg: 'bg-surface' },
  EXTRACTED:        { color: 'text-text-muted', bg: 'bg-surface' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface Props {
  bill: Bill;
  isAdmin: boolean;
  onClose: () => void;
  onMarkPaid: (id: string, txHash: string) => Promise<boolean>;
}

export default function BillDetail({ bill, isAdmin, onClose, onMarkPaid }: Props) {
  const [txHash, setTxHash] = useState('');
  const [marking, setMarking] = useState(false);

  const sc = STATUS_STYLE[bill.status] ?? { color: 'text-text-muted', bg: 'bg-surface' };
  const canMarkPaid = isAdmin && bill.status !== 'PAID' && bill.status !== 'PENDING' && bill.status !== 'PROCESSING';

  const handleMarkPaid = async () => {
    if (!txHash.trim()) return;
    setMarking(true);
    const ok = await onMarkPaid(bill.id, txHash.trim());
    setMarking(false);
    if (ok) onClose();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Bill Detail"
      size="md"
      footer={<ButtonInput label="Close" variant="secondary" onClick={onClose} />}
    >
      <div className="space-y-3 text-sm">
        <DetailRow label="File" value={bill.fileName} />
        <DetailRow label="Uploaded" value={formatDate(bill.createdAt)} />
        <DetailRow label="Status">
          <Badge
            text={bill.status.replace(/_/g, ' ')}
            variant="custom"
            customColor={sc.color}
            customBgColor={sc.bg}
            size="sm"
          />
        </DetailRow>

        {(bill.status === 'PENDING' || bill.status === 'PROCESSING') && (
          <p className="text-xs text-text-muted italic">
            AI extraction in progress — this page will update automatically.
          </p>
        )}

        {bill.fromName && <DetailRow label="From" value={bill.fromName} />}
        {bill.toName && <DetailRow label="To" value={bill.toName} />}
        {bill.amount && bill.currency && (
          <DetailRow label="Amount" value={`${bill.amount} ${bill.currency}`} />
        )}
        {bill.reference && <DetailRow label="Reference" value={bill.reference} mono />}
        {bill.itemTags.length > 0 && (
          <DetailRow label="Items">
            <TagList tags={bill.itemTags} />
          </DetailRow>
        )}

        {(bill.bankHolder || bill.bankIban) && (
          <div className="pt-3 border-t border-input-border space-y-2">
            {bill.bankHolder && <DetailRow label="Bank holder" value={bill.bankHolder} />}
            {(bill.bankStreet || bill.bankStreetNr) && (
              <DetailRow label="Address" value={`${bill.bankStreet ?? ''} ${bill.bankStreetNr ?? ''}`.trim()} />
            )}
            {(bill.bankZip || bill.bankCity) && (
              <DetailRow label="City" value={`${bill.bankZip ?? ''} ${bill.bankCity ?? ''}`.trim()} />
            )}
            {bill.bankIban && <DetailRow label="IBAN" value={bill.bankIban} mono />}
          </div>
        )}

        {bill.safeAddress && (
          <DetailRow label="Pay to">
            <AddressDisplay address={bill.safeAddress} />
          </DetailRow>
        )}

        {bill.paidTxHash && <DetailRow label="Paid tx" value={bill.paidTxHash} mono />}
        {bill.paidAt && <DetailRow label="Paid at" value={formatDate(bill.paidAt)} />}
        {bill.error && (
          <DetailRow label="Error">
            <span className="text-error break-all">{bill.error}</span>
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
