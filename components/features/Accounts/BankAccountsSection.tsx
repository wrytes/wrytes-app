import { useEffect, useState, useCallback } from 'react';
import {
  faBuildingColumns,
  faPlus,
  faTrash,
  faStar,
  faPenToSquare,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PageHeader, Section } from '@/components/ui/Layout';
import { ButtonInput, TextInput, TabInput } from '@/components/ui/Input';
import { Badge, Modal, ConfirmModal, showToast } from '@/components/ui';
import { Table, TableBody, TableHead, TableRow, TableRowEmpty } from '@/components/ui/Table';
import { useSort } from '@/hooks/useSort';
import { apiRequest } from '@/lib/api/client';
import type { BankAccount } from './types';

const HEADERS = ['Label', 'Holder', 'IBAN', 'Currency', 'Default', 'Actions'];

const EMPTY_FORM = {
  iban: '',
  bic: '',
  holderName: '',
  currency: 'CHF' as 'CHF' | 'EUR',
  label: '',
  isDefault: false,
};

interface Props {
  isAdmin: boolean;
  hasScope: boolean;
}

export default function BankAccountsSection({ isAdmin, hasScope }: Props) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const { sortTab: accSort, sortReverse: accRev, handleSort: handleAccSort } = useSort('Label');
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BankAccount | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<typeof EMPTY_FORM>>({});
  const [editTarget, setEditTarget] = useState<BankAccount | null>(null);
  const [editForm, setEditForm] = useState({ label: '', bic: '', holderName: '' });
  const [editErrors, setEditErrors] = useState<Partial<typeof editForm>>({});
  const [editSaving, setEditSaving] = useState(false);

  const load = useCallback(async () => {
    if (!hasScope) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest<BankAccount[]>('/bank-accounts');
      setAccounts(Array.isArray(data) ? data : []);
    } catch {
      showToast.error('Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  }, [hasScope]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (field: keyof typeof EMPTY_FORM) => (value: string | boolean) =>
    setForm(f => ({ ...f, [field]: value }));

  const validate = () => {
    const e: Partial<typeof EMPTY_FORM> = {};
    if (!form.iban.trim()) e.iban = 'Required';
    if (!form.bic.trim()) e.bic = 'Required';
    if (!form.holderName.trim()) e.holderName = 'Required';
    if (!form.label.trim()) e.label = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await apiRequest('/bank-accounts', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      showToast.success('Bank account added');
      setAddOpen(false);
      setForm(EMPTY_FORM);
      setErrors({});
      load();
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message;
      showToast.error(msg || 'Failed to add account');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await apiRequest(`/bank-accounts/${id}/default`, { method: 'POST' });
      showToast.success('Default account updated');
      load();
    } catch {
      showToast.error('Failed to update default');
    }
  };

  const openEdit = (acc: BankAccount) => {
    setEditTarget(acc);
    setEditForm({ label: acc.label, bic: acc.bic, holderName: acc.holderName });
    setEditErrors({});
  };

  const setEdit = (field: keyof typeof editForm) => (value: string) =>
    setEditForm(f => ({ ...f, [field]: value }));

  const handleEdit = async () => {
    if (!editTarget) return;
    const e: Partial<typeof editForm> = {};
    if (!editForm.label.trim()) e.label = 'Required';
    if (!editForm.bic.trim()) e.bic = 'Required';
    if (!editForm.holderName.trim()) e.holderName = 'Required';
    setEditErrors(e);
    if (Object.keys(e).length > 0) return;

    const body: Record<string, string> = {};
    if (editForm.label.trim() !== editTarget.label) body.label = editForm.label.trim();
    if (editForm.bic.trim() !== editTarget.bic) body.bic = editForm.bic.trim();
    if (editForm.holderName.trim() !== editTarget.holderName)
      body.holderName = editForm.holderName.trim();

    if (Object.keys(body).length === 0) {
      setEditTarget(null);
      return;
    }

    setEditSaving(true);
    try {
      await apiRequest(`/bank-accounts/${editTarget.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      showToast.success('Account updated');
      setEditTarget(null);
      load();
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message;
      showToast.error(msg || 'Failed to update account');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiRequest(`/bank-accounts/${deleteTarget.id}`, { method: 'DELETE' });
      showToast.success('Account removed');
      setDeleteTarget(null);
      load();
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message;
      showToast.error(msg || 'Failed to remove account');
    }
  };

  const sortedAccounts = [...accounts].sort((a, b) => {
    const m = accRev ? -1 : 1;
    switch (accSort) {
      case 'Holder':
        return m * a.holderName.localeCompare(b.holderName);
      case 'IBAN':
        return m * a.iban.localeCompare(b.iban);
      case 'Currency':
        return m * a.currency.localeCompare(b.currency);
      case 'Default':
        return m * (Number(b.isDefault) - Number(a.isDefault));
      default:
        return m * a.label.localeCompare(b.label);
    }
  });

  return (
    <>
      <Section>
        <PageHeader
          title="Accounts"
          description="Bank Account and Safe Wallet destinations"
          icon={faBuildingColumns}
          actions={
            hasScope ? (
              <ButtonInput
                label="Add account"
                icon={<FontAwesomeIcon icon={faPlus} />}
                variant="primary"
                size="sm"
                onClick={() => setAddOpen(true)}
              />
            ) : undefined
          }
        />

        {!hasScope ? (
          <p className="text-text-secondary text-sm">
            Bank account management requires the{' '}
            <Badge
              text="BANK"
              variant="custom"
              customColor="text-orange-400"
              customBgColor="bg-orange-400/10"
              size="sm"
            />{' '}
            scope.
          </p>
        ) : (
        <Table>
          <TableHead
            headers={HEADERS}
            colSpan={HEADERS.length}
            tab={accSort}
            reverse={accRev}
            tabOnChange={handleAccSort}
          />
          <TableBody>
            {loading ? (
              <TableRowEmpty>Loading…</TableRowEmpty>
            ) : sortedAccounts.length === 0 ? (
              <TableRowEmpty>No bank accounts yet. Add one to enable off-ramp.</TableRowEmpty>
            ) : (
              sortedAccounts.map(acc => (
                <TableRow
                  key={acc.id}
                  headers={HEADERS}
                  colSpan={HEADERS.length}
                  tab={accSort}
                  rawHeader
                >
                  <div className="text-left font-medium text-text-primary">{acc.label}</div>
                  <div className="text-right text-text-secondary">{acc.holderName}</div>
                  <div className="text-right font-mono text-text-secondary text-sm">{acc.iban}</div>
                  <div className="flex justify-end">
                    <Badge
                      text={acc.currency}
                      variant="custom"
                      customColor={acc.currency === 'CHF' ? 'text-red-400' : 'text-blue-400'}
                      customBgColor={acc.currency === 'CHF' ? 'bg-red-400/10' : 'bg-blue-400/10'}
                      size="sm"
                    />
                  </div>
                  <div className="flex justify-end">
                    {acc.isDefault ? (
                      <Badge
                        text="Default"
                        variant="custom"
                        customColor="text-green-400"
                        customBgColor="bg-green-400/10"
                        size="sm"
                      />
                    ) : (
                      <button
                        onClick={() => handleSetDefault(acc.id)}
                        className="text-xs text-gray-500 hover:text-orange-400 transition-colors flex items-center gap-1"
                      >
                        <FontAwesomeIcon icon={faStar} className="text-xs" />
                        Set default
                      </button>
                    )}
                  </div>
                  <div className="flex justify-end items-center gap-3">
                    <button
                      onClick={() => openEdit(acc)}
                      className="text-xs text-text-secondary hover:text-orange-400 transition-colors flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faPenToSquare} className="text-xs" />
                      Edit
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => setDeleteTarget(acc)}
                        className="text-xs text-red-500 hover:text-red-400 transition-colors flex items-center gap-1"
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-xs" />
                        Remove
                      </button>
                    )}
                  </div>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        )}
      </Section>

      {/* Add modal */}
      <Modal
        isOpen={addOpen}
        onClose={() => {
          setAddOpen(false);
          setForm(EMPTY_FORM);
          setErrors({});
        }}
        title="Add Bank Account"
        size="md"
        footer={
          <ButtonInput
            label={saving ? 'Adding…' : 'Add account'}
            variant="primary"
            onClick={handleAdd}
            loading={saving}
            disabled={saving}
            second={{
              label: 'Cancel',
              variant: 'secondary',
              onClick: () => {
                setAddOpen(false);
                setForm(EMPTY_FORM);
                setErrors({});
              },
            }}
          />
        }
      >
        <div className="space-y-3">
          <TextInput
            label="IBAN"
            value={form.iban}
            onChange={v => set('iban')(v.replace(/\s/g, '').toUpperCase())}
            placeholder="CH5604835012345678009"
            error={errors.iban}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="BIC / SWIFT"
              value={form.bic}
              onChange={v => set('bic')(v.toUpperCase())}
              placeholder="CRESCHZZ80A"
              error={errors.bic}
            />
            <TextInput
              label="Account holder"
              value={form.holderName}
              onChange={set('holderName')}
              placeholder="Alice Smith"
              error={errors.holderName}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="Label"
              value={form.label}
              onChange={set('label')}
              placeholder="main"
              error={errors.label}
              note="Unique identifier for this account"
            />
            <div>
              <div className="text-card-input-label text-xs mb-2">Currency</div>
              <TabInput
                tabs={['CHF', 'EUR']}
                tab={form.currency}
                setTab={v => set('currency')(v as 'CHF' | 'EUR')}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={e => set('isDefault')(e.target.checked)}
              className="accent-orange-500"
            />
            Set as default account
          </label>
        </div>
      </Modal>

      {/* Edit account modal */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Bank Account"
        size="md"
        footer={
          <ButtonInput
            label={editSaving ? 'Saving…' : 'Save'}
            variant="primary"
            onClick={handleEdit}
            loading={editSaving}
            disabled={editSaving}
            second={{
              label: 'Cancel',
              variant: 'secondary',
              onClick: () => setEditTarget(null),
            }}
          />
        }
      >
        <div className="space-y-3">
          <TextInput
            label="Label"
            value={editForm.label}
            onChange={setEdit('label')}
            placeholder="e.g. main"
            error={editErrors.label}
            note="Unique identifier for this account"
          />
          <div className="grid grid-cols-2 gap-3">
            <TextInput
              label="BIC / SWIFT"
              value={editForm.bic}
              onChange={v => setEdit('bic')(v.toUpperCase())}
              placeholder="CRESCHZZ80A"
              error={editErrors.bic}
            />
            <TextInput
              label="Account holder"
              value={editForm.holderName}
              onChange={setEdit('holderName')}
              placeholder="Alice Smith"
              error={editErrors.holderName}
            />
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove Bank Account"
        message={
          <span>
            Remove <strong>{deleteTarget?.label}</strong> ({deleteTarget?.iban})? This cannot be
            undone if no active off-ramp route uses it.
          </span>
        }
        confirmText="Remove"
        cancelText="Cancel"
        confirmVariant="danger"
        onConfirm={handleDelete}
      />
    </>
  );
}
