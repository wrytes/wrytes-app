import { useState } from 'react';
import { faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Modal } from '@/components/ui/modal';
import { ButtonInput, TextInput, SelectInput } from '@/components/ui/input';
import type { InvoiceItem, Invoice } from './types';

const CURRENCY_OPTIONS = [
  { value: 'CHF', label: 'CHF' },
  { value: 'EUR', label: 'EUR' },
  { value: 'USD', label: 'USD' },
];

const EMPTY_ITEM: InvoiceItem = { description: '', quantity: 1, unitPrice: 0 };

function toDateInput(iso?: string | null) {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function formatTotal(n: number) {
  return n.toLocaleString('en-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface Props {
  onClose: () => void;
  onCreated: (invoice: Invoice) => void;
  onCreate: (data: {
    recipientName: string;
    recipientEmail?: string;
    recipientAddress?: string;
    currency: string;
    issueDate?: string;
    dueDate?: string;
    notes?: string;
    items: InvoiceItem[];
  }) => Promise<Invoice | null>;
}

export default function InvoiceCreateModal({ onClose, onCreated, onCreate }: Props) {
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [currency, setCurrency] = useState('CHF');
  const [issueDate, setIssueDate] = useState(toDateInput(new Date().toISOString()));
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([{ ...EMPTY_ITEM }]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof InvoiceItem, raw: string) => {
    setItems(prev =>
      prev.map((item, idx) =>
        idx === i
          ? {
              ...item,
              [field]: field === 'description' ? raw : parseFloat(raw) || 0,
            }
          : item,
      ),
    );
  };

  const subtotal = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!recipientName.trim()) e.recipientName = 'Required';
    if (items.some(it => !it.description.trim())) e.items = 'All items need a description';
    if (items.some(it => it.quantity <= 0)) e.items = 'Quantity must be > 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    const result = await onCreate({
      recipientName: recipientName.trim(),
      recipientEmail: recipientEmail.trim() || undefined,
      recipientAddress: recipientAddress.trim() || undefined,
      currency,
      issueDate: issueDate || undefined,
      dueDate: dueDate || undefined,
      notes: notes.trim() || undefined,
      items,
    });
    setSaving(false);
    if (result) {
      onCreated(result);
      onClose();
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="New Invoice"
      size="lg"
      footer={
        <ButtonInput
          label={saving ? 'Creating…' : 'Create Invoice'}
          variant="primary"
          loading={saving}
          disabled={saving}
          onClick={handleSave}
          second={{ label: 'Cancel', variant: 'secondary', onClick: onClose }}
        />
      }
    >
      <div className="space-y-5">
        {/* Recipient */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Recipient</p>
          <TextInput
            label="Name"
            value={recipientName}
            onChange={setRecipientName}
            placeholder="Acme Corp"
            error={errors.recipientName}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="Email (optional)"
              value={recipientEmail}
              onChange={setRecipientEmail}
              placeholder="billing@acme.com"
            />
            <TextInput
              label="Address (optional)"
              value={recipientAddress}
              onChange={setRecipientAddress}
              placeholder="Bahnhofstrasse 1, Zurich"
            />
          </div>
        </div>

        {/* Invoice details */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Details</p>
          <div className="grid grid-cols-3 gap-3">
            <SelectInput
              label="Currency"
              options={CURRENCY_OPTIONS}
              value={currency}
              onChange={setCurrency}
            />
            <div>
              <div className="text-input-label text-xs mb-1">Issue date</div>
              <input
                type="date"
                value={issueDate}
                onChange={e => setIssueDate(e.target.value)}
                className="w-full border-2 border-input-border rounded-lg px-3 py-2.5 text-sm text-text-primary bg-transparent outline-none focus:border-brand hover:border-text-secondary transition-colors"
              />
            </div>
            <div>
              <div className="text-input-label text-xs mb-1">Due date (optional)</div>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full border-2 border-input-border rounded-lg px-3 py-2.5 text-sm text-text-primary bg-transparent outline-none focus:border-brand hover:border-text-secondary transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Items</p>
          {errors.items && <p className="text-xs text-error">{errors.items}</p>}

          <div className="rounded-lg border border-table-alt overflow-hidden">
            <div className="grid grid-cols-[1fr_80px_100px_80px_32px] gap-0 bg-surface px-3 py-2 text-xs font-semibold text-text-muted uppercase tracking-wider border-b border-table-alt">
              <span>Description</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Unit price</span>
              <span className="text-right">Total</span>
              <span />
            </div>

            {items.map((item, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_80px_100px_80px_32px] gap-0 px-3 py-2 border-b border-table-alt/50 last:border-0 items-center"
              >
                <input
                  type="text"
                  value={item.description}
                  onChange={e => updateItem(i, 'description', e.target.value)}
                  placeholder="Description"
                  className="bg-transparent text-sm text-text-primary placeholder:text-input-empty outline-none w-full pr-3"
                />
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={item.quantity}
                  onChange={e => updateItem(i, 'quantity', e.target.value)}
                  className="bg-transparent text-sm text-text-primary text-right outline-none w-full"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={e => updateItem(i, 'unitPrice', e.target.value)}
                  className="bg-transparent text-sm text-text-primary text-right outline-none w-full"
                />
                <span className="text-sm text-text-primary text-right tabular-nums">
                  {formatTotal(item.quantity * item.unitPrice)}
                </span>
                <button
                  onClick={() => removeItem(i)}
                  disabled={items.length === 1}
                  className="flex justify-center text-text-muted hover:text-error transition-colors disabled:opacity-30"
                >
                  <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={addItem}
            className="flex items-center gap-1.5 text-xs text-brand border border-brand/30 px-3 py-1.5 rounded-lg hover:bg-brand/10 transition-colors"
          >
            <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
            Add item
          </button>
        </div>

        {/* Total */}
        <div className="flex justify-end items-center gap-4 pt-1 border-t border-table-alt">
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Total</span>
          <span className="text-lg font-bold text-text-primary tabular-nums">
            {currency} {formatTotal(subtotal)}
          </span>
        </div>

        {/* Notes */}
        <div>
          <div className="text-input-label text-xs mb-1">Notes (optional)</div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Payment terms, bank details, thank-you note…"
            rows={3}
            className="w-full border-2 border-input-border rounded-lg px-3 py-2.5 text-sm text-text-primary bg-transparent outline-none focus:border-brand hover:border-text-secondary transition-colors resize-none placeholder:text-input-empty"
          />
        </div>
      </div>
    </Modal>
  );
}
