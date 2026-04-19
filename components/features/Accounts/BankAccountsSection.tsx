import { useEffect, useState, useCallback } from 'react';
import { faBuildingColumns, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PageHeader, Section } from '@/components/ui/Layout';
import { ButtonInput, TextInput, TabInput } from '@/components/ui/Input';
import { Badge, Modal, showToast } from '@/components/ui';
import { FIAT_CURRENCY_TABS, FIAT_CURRENCY_BADGE, type FiatCurrency } from '@/lib/currencies';
import {
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableRowEmpty,
  EditableCell,
} from '@/components/ui/Table';
import { useSort } from '@/hooks/useSort';
import { apiRequest } from '@/lib/api/client';
import type { BankAccount } from './types';

const HEADERS = ['IBAN', 'Currency', 'Label'];

const EMPTY_FORM = {
  iban: '',
  bic: '',
  currency: 'CHF' as FiatCurrency,
  label: '',
};

interface Props {
  hasScope: boolean;
}

export default function BankAccountsSection({ hasScope }: Props) {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<typeof EMPTY_FORM>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const { sortTab: accSort, sortReverse: accRev, handleSort: handleAccSort } = useSort('IBAN');

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

  const set = (field: keyof typeof EMPTY_FORM) => (value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const validate = () => {
    const e: Partial<typeof EMPTY_FORM> = {};
    if (!form.iban.trim()) e.iban = 'Required';
    if (!form.bic.trim()) e.bic = 'Required';
    if (!form.label.trim()) e.label = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await apiRequest('/bank-accounts', { method: 'POST', body: JSON.stringify(form) });
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

  const startEdit = (acc: BankAccount) => {
    setEditingId(acc.id);
    setEditValue(acc.label);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveLabel = async (acc: BankAccount) => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === acc.label) {
      cancelEdit();
      return;
    }
    try {
      await apiRequest(`/bank-accounts/${acc.id}`, {
        method: 'PUT',
        body: JSON.stringify({ label: trimmed }),
      });
      setAccounts(prev => prev.map(a => (a.id === acc.id ? { ...a, label: trimmed } : a)));
      showToast.success('Label updated');
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message;
      showToast.error(msg || 'Failed to update label');
    }
    cancelEdit();
  };

  const sortedAccounts = [...accounts].sort((a, b) => {
    const m = accRev ? -1 : 1;
    switch (accSort) {
      case 'Label':
        return m * a.label.localeCompare(b.label);
      case 'Currency':
        return m * a.currency.localeCompare(b.currency);
      default:
        return m * a.iban.localeCompare(b.iban);
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
              customColor="text-brand"
              customBgColor="bg-brand/10"
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
                    <div className="text-left font-mono text-sm">{acc.iban}</div>
                    <div className="flex justify-end">
                      <Badge
                        text={acc.currency}
                        variant="custom"
                        customColor={FIAT_CURRENCY_BADGE[acc.currency]?.color ?? 'text-text-muted'}
                        customBgColor={FIAT_CURRENCY_BADGE[acc.currency]?.bg ?? 'bg-surface'}
                        size="sm"
                      />
                    </div>
                    <EditableCell
                      value={acc.label}
                      isEditing={editingId === acc.id}
                      editValue={editValue}
                      onEdit={() => startEdit(acc)}
                      onSave={() => saveLabel(acc)}
                      onCancel={cancelEdit}
                      onChange={setEditValue}
                      align="right"
                    />
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
          <div>
            <div className="text-input-label text-xs mb-2">Currency</div>
            <TabInput
              tabs={FIAT_CURRENCY_TABS}
              tab={form.currency}
              setTab={v => set('currency')(v as FiatCurrency)}
            />
          </div>

          <TextInput
            label="Label"
            value={form.label}
            onChange={set('label')}
            placeholder="main"
            error={errors.label}
          />
          <TextInput
            label="IBAN"
            value={form.iban}
            onChange={v => set('iban')(v.replace(/\s/g, '').toUpperCase())}
            placeholder="CH5604835012345678009"
            error={errors.iban}
          />
          <TextInput
            label="BIC / SWIFT"
            value={form.bic}
            onChange={v => set('bic')(v.toUpperCase())}
            placeholder="CRESCHZZ80A"
            error={errors.bic}
          />
        </div>
      </Modal>
    </>
  );
}
