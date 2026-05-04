import { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBook,
  faChevronDown,
  faChevronUp,
  faCheck,
  faPencil,
  faPlus,
  faTimes,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/Modal';
import { ButtonInput } from '@/components/ui/Input';
import { SelectInput } from '@/components/ui/Input';
import { TextInput } from '@/components/ui/Input';
import { apiRequest } from '@/lib/api/client';
import type { AccountingAccount, AccountType, NormalBalance } from './types';

const ACCOUNT_TYPES: AccountType[] = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

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

const TYPE_OPTIONS = ACCOUNT_TYPES.map(t => ({ value: t, label: ACCOUNT_TYPE_LABEL[t] }));
const BALANCE_OPTIONS = [
  { value: 'DEBIT', label: 'Debit' },
  { value: 'CREDIT', label: 'Credit' },
];

interface AccountFormState {
  name: string;
  code: string;
  type: AccountType;
  normalBalance: NormalBalance;
}

const DEFAULT_FORM: AccountFormState = {
  name: '',
  code: '',
  type: 'ASSET',
  normalBalance: 'DEBIT',
};

interface Props {
  accounts: AccountingAccount[];
  onRefresh: () => Promise<void>;
}

export function AccountsPanel({ accounts, onRefresh }: Props) {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AccountingAccount | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AccountingAccount | null>(null);
  const [form, setForm] = useState<AccountFormState>(DEFAULT_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const openAdd = () => {
    setEditTarget(null);
    setForm(DEFAULT_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (acc: AccountingAccount) => {
    setEditTarget(acc);
    setForm({ name: acc.name, code: acc.code ?? '', type: acc.type, normalBalance: acc.normalBalance });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError('Name is required'); return; }
    setSaving(true);
    setFormError('');
    try {
      if (editTarget) {
        await apiRequest(`/accounting/accounts/${editTarget.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: form.name.trim(), code: form.code.trim() || undefined }),
        });
      } else {
        await apiRequest('/accounting/accounts', {
          method: 'POST',
          body: JSON.stringify({
            name: form.name.trim(),
            code: form.code.trim() || undefined,
            type: form.type,
            normalBalance: form.normalBalance,
          }),
        });
      }
      setModalOpen(false);
      await onRefresh();
    } catch (e: any) {
      setFormError(e?.message ?? 'Failed to save account');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiRequest(`/accounting/accounts/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      await onRefresh();
    } finally {
      setDeleting(false);
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<AccountType, AccountingAccount[]>();
    for (const t of ACCOUNT_TYPES) map.set(t, []);
    for (const a of accounts) map.get(a.type)?.push(a);
    return map;
  }, [accounts]);

  return (
    <>
      <div className="bg-card border border-table-alt rounded-lg overflow-hidden">
        <button
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
        >
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faBook} className="w-3.5 h-3.5 text-brand" />
            Chart of Accounts
            <span className="text-xs text-text-muted font-normal">({accounts.length})</span>
          </div>
          <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} className="w-3 h-3" />
        </button>

        {open && (
          <div className="border-t border-table-alt">
            {/* Toolbar */}
            <div className="px-4 py-3 border-b border-table-alt flex items-center justify-between">
              <span className="text-xs text-text-muted">
                {accounts.length} account{accounts.length !== 1 ? 's' : ''}
              </span>
              <ButtonInput
                label="Add Account"
                variant="outline"
                size="sm"
                icon={<FontAwesomeIcon icon={faPlus} className="w-3 h-3" />}
                onClick={openAdd}
              />
            </div>

            {/* Grouped list */}
            {ACCOUNT_TYPES.map(type => {
              const group = grouped.get(type) ?? [];
              if (group.length === 0) return null;
              return (
                <div key={type}>
                  <div className="px-4 py-1.5 bg-surface/50 border-b border-table-alt">
                    <span className={`text-xs font-bold uppercase tracking-wider ${ACCOUNT_TYPE_COLOR[type]}`}>
                      {ACCOUNT_TYPE_LABEL[type]}
                    </span>
                  </div>
                  {group.map(acc => (
                    <div
                      key={acc.id}
                      className="flex items-center gap-3 px-4 py-2.5 border-b border-table-alt/50 hover:bg-surface/30"
                    >
                      {acc.code && (
                        <span className="text-xs text-text-muted font-mono w-10 shrink-0">{acc.code}</span>
                      )}
                      <span className="flex-1 text-sm text-text-primary">{acc.name}</span>
                      <span className="text-xs text-text-muted">{acc.normalBalance}</span>
                      <button
                        onClick={() => openEdit(acc)}
                        className="text-text-muted hover:text-brand transition-colors p-1"
                        title="Edit"
                      >
                        <FontAwesomeIcon icon={faPencil} className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(acc)}
                        className="text-text-muted hover:text-error transition-colors p-1"
                        title="Delete"
                      >
                        <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              );
            })}

            {accounts.length === 0 && (
              <p className="text-center text-text-muted text-sm py-6">No accounts yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Edit Account' : 'Add Account'}
        size="sm"
        footer={
          <ButtonInput
            label="Cancel"
            variant="secondary"
            onClick={() => setModalOpen(false)}
            disabled={saving}
            second={{
              label: editTarget ? 'Save Changes' : 'Create',
              variant: 'primary',
              onClick: handleSave,
              loading: saving,
              disabled: saving,
            }}
          />
        }
      >
        <div className="space-y-4">
          <TextInput
            label="Account Name"
            value={form.name}
            onChange={v => setForm(f => ({ ...f, name: v }))}
            placeholder="e.g. Crypto Assets"
            error={formError || undefined}
          />
          <TextInput
            label="Code (optional)"
            value={form.code}
            onChange={v => setForm(f => ({ ...f, code: v }))}
            placeholder="e.g. 1000"
          />
          {!editTarget && (
            <>
              <SelectInput
                label="Type"
                options={TYPE_OPTIONS}
                value={form.type}
                onChange={v => setForm(f => ({ ...f, type: v as AccountType }))}
              />
              <SelectInput
                label="Normal Balance"
                options={BALANCE_OPTIONS}
                value={form.normalBalance}
                onChange={v => setForm(f => ({ ...f, normalBalance: v as NormalBalance }))}
              />
            </>
          )}
        </div>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Account"
        message={
          deleteTarget
            ? `Delete "${deleteTarget.name}"? This will fail if journal entries reference this account.`
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
