import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronDown,
  faChevronUp,
  faPencil,
  faPlus,
  faRotateLeft,
  faSlidersH,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/Modal';
import { ButtonInput } from '@/components/ui/Input';
import { SelectInput } from '@/components/ui/Input';
import { Badge } from '@/components/ui';
import { apiRequest } from '@/lib/api/client';
import type { AccountingAccount, ClassificationTemplate, TransferClassification } from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CLASSIFICATION_OPTIONS = [
  { value: 'ASSET',        label: 'Asset' },
  { value: 'RECEIVED',     label: 'Received' },
  { value: 'SWAP_IN',      label: 'Swap In' },
  { value: 'LIABILITY',    label: 'Liability' },
  { value: 'PAYMENT',      label: 'Payment' },
  { value: 'SWAP_OUT',     label: 'Swap Out' },
  { value: 'TRANSFER',     label: 'Transfer' },
  { value: 'SKIPPED',      label: 'Skipped' },
  { value: 'UNCLASSIFIED', label: 'Unclassified' },
];

const DIRECTION_OPTIONS = [
  { value: 'ANY', label: 'Any direction' },
  { value: 'IN',  label: 'In only' },
  { value: 'OUT', label: 'Out only' },
];

const CLASSIFICATION_STYLE: Record<TransferClassification, { color: string; bg: string }> = {
  ASSET:        { color: 'text-success',        bg: 'bg-success-bg' },
  RECEIVED:     { color: 'text-success',        bg: 'bg-success-bg' },
  SWAP_IN:      { color: 'text-info',           bg: 'bg-info/10' },
  LIABILITY:    { color: 'text-error',          bg: 'bg-error-bg' },
  PAYMENT:      { color: 'text-error',          bg: 'bg-error-bg' },
  SWAP_OUT:     { color: 'text-warning',        bg: 'bg-warning/10' },
  TRANSFER:     { color: 'text-brand',          bg: 'bg-brand/10' },
  SKIPPED:      { color: 'text-text-muted',     bg: 'bg-surface' },
  UNCLASSIFIED: { color: 'text-text-secondary', bg: 'bg-surface' },
  CAPITAL:      { color: 'text-success',        bg: 'bg-success-bg' },
  INCOME:       { color: 'text-success',        bg: 'bg-success-bg' },
  LOAN:         { color: 'text-info',           bg: 'bg-info/10' },
  REPAYMENT:    { color: 'text-brand',          bg: 'bg-brand/10' },
  EXPENSE:      { color: 'text-error',          bg: 'bg-error-bg' },
  NEUTRAL:      { color: 'text-text-muted',     bg: 'bg-surface' },
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TemplateFormState {
  classification: TransferClassification;
  direction: string;
  debitAccountId: string;
  creditAccountId: string;
}

interface Props {
  templates: ClassificationTemplate[];
  accounts: AccountingAccount[];
  onRefresh: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TemplatesPanel({ templates, accounts, onRefresh }: Props) {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ClassificationTemplate | null>(null);
  const [revertTarget, setRevertTarget] = useState<ClassificationTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassificationTemplate | null>(null);
  const [form, setForm] = useState<TemplateFormState>({
    classification: 'ASSET',
    direction: 'ANY',
    debitAccountId: '',
    creditAccountId: '',
  });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const accountOptions = accounts.map(a => ({
    value: a.id,
    label: a.code ? `${a.code} · ${a.name}` : a.name,
  }));

  const openAdd = () => {
    setEditTarget(null);
    setForm({
      classification: 'ASSET',
      direction: 'ANY',
      debitAccountId: accounts[0]?.id ?? '',
      creditAccountId: accounts[1]?.id ?? accounts[0]?.id ?? '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (tmpl: ClassificationTemplate) => {
    setEditTarget(tmpl);
    setForm({
      classification: tmpl.classification,
      direction: tmpl.direction,
      debitAccountId: tmpl.debitAccountId ?? accounts[0]?.id ?? '',
      creditAccountId: tmpl.creditAccountId ?? accounts[1]?.id ?? accounts[0]?.id ?? '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.debitAccountId || !form.creditAccountId) {
      setFormError('Both debit and credit accounts are required');
      return;
    }
    // Validate no duplicate when adding
    if (!editTarget) {
      const conflict = templates.find(
        t => t.classification === form.classification && t.direction === form.direction && t.isOverridden
      );
      if (conflict) {
        setFormError(`An override for ${form.classification} / ${form.direction} already exists. Edit it instead.`);
        return;
      }
    }
    setSaving(true);
    setFormError('');
    try {
      await apiRequest('/accounting/templates', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      setModalOpen(false);
      await onRefresh();
    } catch (e: any) {
      setFormError(e?.message ?? 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = async () => {
    if (!revertTarget?.id) return;
    setReverting(true);
    try {
      await apiRequest(`/accounting/templates/${revertTarget.id}`, { method: 'DELETE' });
      setRevertTarget(null);
      await onRefresh();
    } finally {
      setReverting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    setDeleting(true);
    try {
      await apiRequest(`/accounting/templates/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      await onRefresh();
    } finally {
      setDeleting(false);
    }
  };

  const overrideCount = templates.filter(t => t.isOverridden).length;
  const isDefaultTemplate = (tmpl: ClassificationTemplate) =>
    ['ASSET', 'RECEIVED', 'SWAP_IN', 'LIABILITY', 'PAYMENT', 'SWAP_OUT', 'TRANSFER'].includes(
      tmpl.classification
    );

  return (
    <>
      <div className="bg-card border border-table-alt rounded-lg overflow-hidden">
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
        >
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faSlidersH} className="w-3.5 h-3.5 text-brand" />
            Journal Templates
            {overrideCount > 0 && (
              <span className="text-xs text-brand font-normal">({overrideCount} overridden)</span>
            )}
          </div>
          <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} className="w-3 h-3" />
        </button>

        {open && (
          <div className="border-t border-table-alt">
            {/* Toolbar */}
            <div className="px-4 py-3 border-b border-table-alt flex items-center justify-between">
              <p className="text-xs text-text-muted">
                Define which accounts are debited/credited for each transfer classification.
              </p>
              <ButtonInput
                label="Add Override"
                variant="outline"
                size="sm"
                icon={<FontAwesomeIcon icon={faPlus} className="w-3 h-3" />}
                onClick={openAdd}
                disabled={accounts.length === 0}
              />
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_6rem_1fr_1fr_5rem] px-4 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-table-alt bg-surface/30">
              <span>Classification</span>
              <span>Direction</span>
              <span>Debit Account</span>
              <span>Credit Account</span>
              <span />
            </div>

            {templates.length === 0 ? (
              <p className="text-center text-text-muted text-sm py-6">No templates yet.</p>
            ) : (
              templates.map(tmpl => {
                const cls = CLASSIFICATION_STYLE[tmpl.classification] ?? CLASSIFICATION_STYLE.UNCLASSIFIED;
                const key = `${tmpl.classification}:${tmpl.direction}`;
                const clsLabel = CLASSIFICATION_OPTIONS.find(o => o.value === tmpl.classification)?.label ?? tmpl.classification;
                const dirLabel = tmpl.direction === 'ANY' ? 'Any' : tmpl.direction;

                return (
                  <div
                    key={key}
                    className="grid grid-cols-[1fr_6rem_1fr_1fr_5rem] items-center px-4 py-2.5 border-b border-table-alt/50 hover:bg-surface/30 gap-2"
                  >
                    {/* Classification */}
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${cls.bg} ${cls.color}`}>
                        {clsLabel}
                      </span>
                      {tmpl.isOverridden && (
                        <Badge
                          text="override"
                          variant="custom"
                          customColor="text-brand"
                          customBgColor="bg-brand/10"
                          size="sm"
                        />
                      )}
                    </div>

                    {/* Direction */}
                    <span className="text-xs text-text-muted">{dirLabel}</span>

                    {/* Debit account */}
                    <span className="text-sm text-text-primary truncate" title={tmpl.debitAccountName}>
                      {tmpl.debitAccountName ?? <span className="text-text-muted italic">—</span>}
                    </span>

                    {/* Credit account */}
                    <span className="text-sm text-text-primary truncate" title={tmpl.creditAccountName}>
                      {tmpl.creditAccountName ?? <span className="text-text-muted italic">—</span>}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(tmpl)}
                        title="Edit"
                        className="text-text-muted hover:text-brand transition-colors p-1"
                      >
                        <FontAwesomeIcon icon={faPencil} className="w-3 h-3" />
                      </button>
                      {tmpl.isOverridden && isDefaultTemplate(tmpl) && (
                        <button
                          onClick={() => setRevertTarget(tmpl)}
                          title="Revert to default"
                          className="text-text-muted hover:text-warning transition-colors p-1"
                        >
                          <FontAwesomeIcon icon={faRotateLeft} className="w-3 h-3" />
                        </button>
                      )}
                      {tmpl.isOverridden && !isDefaultTemplate(tmpl) && (
                        <button
                          onClick={() => setDeleteTarget(tmpl)}
                          title="Delete override"
                          className="text-text-muted hover:text-error transition-colors p-1"
                        >
                          <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Journal Template' : 'Add Template Override'}
        size="md"
        footer={
          <ButtonInput
            label="Cancel"
            variant="secondary"
            onClick={() => setModalOpen(false)}
            disabled={saving}
            second={{
              label: editTarget ? 'Save Changes' : 'Create Override',
              variant: 'primary',
              onClick: handleSave,
              loading: saving,
              disabled: saving || accounts.length === 0,
            }}
          />
        }
      >
        <div className="space-y-4">
          {/* Classification + Direction — read-only when editing */}
          <div className="grid grid-cols-2 gap-4">
            <SelectInput
              label="Classification"
              options={CLASSIFICATION_OPTIONS}
              value={form.classification}
              onChange={v => setForm(f => ({ ...f, classification: v as TransferClassification }))}
              disabled={!!editTarget}
            />
            <SelectInput
              label="Direction"
              options={DIRECTION_OPTIONS}
              value={form.direction}
              onChange={v => setForm(f => ({ ...f, direction: v }))}
              disabled={!!editTarget}
            />
          </div>

          {/* Debit account */}
          <SelectInput
            label="Debit Account (DR)"
            options={accountOptions}
            value={form.debitAccountId}
            onChange={v => setForm(f => ({ ...f, debitAccountId: v }))}
            placeholder="Select debit account…"
            error={formError && !form.debitAccountId ? 'Required' : undefined}
          />

          {/* Credit account */}
          <SelectInput
            label="Credit Account (CR)"
            options={accountOptions}
            value={form.creditAccountId}
            onChange={v => setForm(f => ({ ...f, creditAccountId: v }))}
            placeholder="Select credit account…"
            error={formError && !form.creditAccountId ? 'Required' : undefined}
          />

          {formError && (
            <p className="text-xs text-error">{formError}</p>
          )}

          <p className="text-xs text-text-muted">
            When a transfer is classified as <strong>{form.classification}</strong> (
            {form.direction === 'ANY' ? 'any direction' : form.direction}), a journal entry will
            debit <em>{accountOptions.find(a => a.value === form.debitAccountId)?.label ?? '—'}</em>{' '}
            and credit <em>{accountOptions.find(a => a.value === form.creditAccountId)?.label ?? '—'}</em>.
          </p>
        </div>
      </Modal>

      {/* Revert confirmation */}
      <ConfirmModal
        isOpen={!!revertTarget}
        onClose={() => setRevertTarget(null)}
        title="Revert to Default"
        message={
          revertTarget
            ? `Remove your override for ${revertTarget.classification} / ${revertTarget.direction}? The default accounts will be used again.`
            : ''
        }
        confirmText="Revert"
        onConfirm={handleRevert}
        loading={reverting}
      />

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Template"
        message={
          deleteTarget
            ? `Delete the template for ${deleteTarget.classification} / ${deleteTarget.direction}? This cannot be undone.`
            : ''
        }
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
