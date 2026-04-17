import { useEffect, useState, useCallback } from 'react';
import { faArrowTrendDown, faPlus, faTrash, faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PageHeader, Section } from '@/components/ui/Layout';
import { ButtonInput, TextInput, TabInput } from '@/components/ui/Input';
import { Badge, Modal, ConfirmModal, AddressDisplay, showToast } from '@/components/ui';
import { Table, TableBody, TableHead, TableRow, TableRowEmpty } from '@/components/ui/Table';
import { useSort } from '@/hooks/useSort';
import { apiRequest } from '@/lib/api/client';
import type { OffRampRoute, BankAccountRef } from './types';

const ROUTE_HEADERS = [
  'Label',
  'Currency',
  'Bank Account',
  'Deposit Address',
  'Min Amount',
  'Status',
  'Actions',
];

const EMPTY_ROUTE = {
  label: '',
  targetCurrency: 'CHF' as 'CHF' | 'EUR',
  bankAccountId: '',
  minTriggerAmount: '',
};

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  ACTIVE: { color: 'text-green-400', bg: 'bg-green-400/10' },
  PAUSED: { color: 'text-gray-400', bg: 'bg-gray-400/10' },
};

const DEFAULT_STATUS_COLOR = { color: 'text-gray-400', bg: 'bg-gray-400/10' };

interface Props {
  isAdmin: boolean;
  hasScope: boolean;
  onRoutesLoaded?: (routes: OffRampRoute[]) => void;
}

export default function OffRampSection({ isAdmin, hasScope, onRoutesLoaded }: Props) {
  const [routes, setRoutes] = useState<OffRampRoute[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [bankAccounts, setBankAccounts] = useState<BankAccountRef[]>([]);

  const { sortTab: rSort, sortReverse: rRev, handleSort: handleRSort } = useSort('Label');

  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_ROUTE);
  const [errors, setErrors] = useState<Partial<typeof EMPTY_ROUTE>>({});

  const [editTarget, setEditTarget] = useState<OffRampRoute | null>(null);
  const [editForm, setEditForm] = useState({ label: '', minTriggerAmount: '' });
  const [editErrors, setEditErrors] = useState<Partial<typeof editForm>>({});
  const [editSaving, setEditSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<OffRampRoute | null>(null);

  const loadRoutes = useCallback(async () => {
    if (!hasScope) {
      setLoadingRoutes(false);
      return;
    }
    setLoadingRoutes(true);
    try {
      const data = await apiRequest<OffRampRoute[]>('/offramp/routes');
      const list = Array.isArray(data) ? data : [];
      setRoutes(list);
      onRoutesLoaded?.(list);
    } catch {
      showToast.error('Failed to load off-ramp routes');
    } finally {
      setLoadingRoutes(false);
    }
  }, [hasScope, onRoutesLoaded]);

  const loadBankAccounts = useCallback(async () => {
    try {
      const data = await apiRequest<BankAccountRef[]>('/bank-accounts');
      setBankAccounts(Array.isArray(data) ? data : []);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    loadRoutes();
    loadBankAccounts();
  }, [loadRoutes, loadBankAccounts]);

  const set = (field: keyof typeof EMPTY_ROUTE) => (value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const filteredBankAccounts = bankAccounts.filter(a => a.currency === form.targetCurrency);

  const validate = () => {
    const e: Partial<typeof EMPTY_ROUTE> = {};
    if (!form.label.trim()) e.label = 'Required';
    if (!form.bankAccountId) e.bankAccountId = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const body: Record<string, string> = {
        label: form.label.trim(),
        targetCurrency: form.targetCurrency,
        bankAccountId: form.bankAccountId,
      };
      if (form.minTriggerAmount.trim()) body.minTriggerAmount = form.minTriggerAmount.trim();
      await apiRequest('/offramp/routes', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      showToast.success('Off-ramp route created');
      setAddOpen(false);
      setForm(EMPTY_ROUTE);
      setErrors({});
      loadRoutes();
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message;
      showToast.error(msg || 'Failed to create route');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (r: OffRampRoute) => {
    setEditTarget(r);
    setEditForm({
      label: r.label,
      minTriggerAmount: r.minTriggerAmount === '0' ? '' : String(r.minTriggerAmount),
    });
    setEditErrors({});
  };

  const setEdit = (field: keyof typeof editForm) => (value: string) =>
    setEditForm(f => ({ ...f, [field]: value }));

  const handleEdit = async () => {
    if (!editTarget) return;
    const e: Partial<typeof editForm> = {};
    if (!editForm.label.trim()) e.label = 'Required';
    setEditErrors(e);
    if (Object.keys(e).length > 0) return;

    const body: Record<string, string> = {};
    if (editForm.label.trim() !== editTarget.label) body.label = editForm.label.trim();
    const origMin = editTarget.minTriggerAmount === '0' ? '' : String(editTarget.minTriggerAmount);
    if (editForm.minTriggerAmount.trim() !== origMin) {
      body.minTriggerAmount = editForm.minTriggerAmount.trim() || '0';
    }

    if (Object.keys(body).length === 0) {
      setEditTarget(null);
      return;
    }

    setEditSaving(true);
    try {
      await apiRequest(`/offramp/routes/${editTarget.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      showToast.success('Route updated');
      setEditTarget(null);
      loadRoutes();
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message;
      showToast.error(msg || 'Failed to update route');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiRequest(`/offramp/routes/${deleteTarget.id}`, { method: 'DELETE' });
      showToast.success('Route removed');
      setDeleteTarget(null);
      loadRoutes();
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message;
      showToast.error(msg || 'Failed to remove route');
    }
  };

  const sortedRoutes = [...routes].sort((a, b) => {
    const m = rRev ? -1 : 1;
    switch (rSort) {
      case 'Currency':
        return m * a.targetCurrency.localeCompare(b.targetCurrency);
      case 'Bank Account':
        return m * a.bankAccount.label.localeCompare(b.bankAccount.label);
      case 'Status':
        return m * a.status.localeCompare(b.status);
      case 'Min Amount':
        return m * (Number(a.minTriggerAmount) - Number(b.minTriggerAmount));
      default:
        return m * a.label.localeCompare(b.label);
    }
  });

  return (
    <>
      <Section>
        <PageHeader
          title="Off-Ramp"
          description="Crypto-to-fiat conversion routes linked to your bank accounts"
          icon={faArrowTrendDown}
          actions={
            hasScope ? (
              <ButtonInput
                label="Add route"
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
            Off-ramp access requires the{' '}
            <Badge
              text="OFFRAMP"
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
              headers={ROUTE_HEADERS}
              colSpan={ROUTE_HEADERS.length}
              tab={rSort}
              reverse={rRev}
              tabOnChange={handleRSort}
            />
            <TableBody>
              {loadingRoutes ? (
                <TableRowEmpty>Loading…</TableRowEmpty>
              ) : sortedRoutes.length === 0 ? (
                <TableRowEmpty>
                  No off-ramp routes yet. Create one to start converting crypto to fiat.
                </TableRowEmpty>
              ) : (
                sortedRoutes.map(r => (
                  <TableRow
                    key={r.id}
                    headers={ROUTE_HEADERS}
                    colSpan={ROUTE_HEADERS.length}
                    tab={rSort}
                    rawHeader
                  >
                    <div className="text-left font-medium text-text-primary">{r.label}</div>
                    <div className="flex justify-end">
                      <Badge
                        text={r.targetCurrency}
                        variant="custom"
                        customColor={r.targetCurrency === 'CHF' ? 'text-red-400' : 'text-blue-400'}
                        customBgColor={
                          r.targetCurrency === 'CHF' ? 'bg-red-400/10' : 'bg-blue-400/10'
                        }
                        size="sm"
                      />
                    </div>
                    <div className="text-right text-text-secondary text-sm">
                      {r.bankAccount.label}
                    </div>
                    <div className="text-right">
                      <AddressDisplay
                        address={r.depositAddress}
                        prefixLength={6}
                        suffixLength={4}
                      />
                    </div>
                    <div className="text-right text-text-secondary text-sm font-mono">
                      {Number(r.minTriggerAmount) > 0 ? r.minTriggerAmount : '—'}
                    </div>
                    <div className="flex justify-end">
                      <Badge
                        text={r.status}
                        variant="custom"
                        customColor={(STATUS_COLORS[r.status] ?? DEFAULT_STATUS_COLOR).color}
                        customBgColor={(STATUS_COLORS[r.status] ?? DEFAULT_STATUS_COLOR).bg}
                        size="sm"
                      />
                    </div>
                    <div className="flex justify-end items-center gap-3">
                      <button
                        onClick={() => openEdit(r)}
                        className="text-xs text-text-secondary hover:text-orange-400 transition-colors flex items-center gap-1"
                      >
                        <FontAwesomeIcon icon={faPenToSquare} className="text-xs" />
                        Edit
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => setDeleteTarget(r)}
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

      {/* Create route modal */}
      <Modal
        isOpen={addOpen}
        onClose={() => {
          setAddOpen(false);
          setForm(EMPTY_ROUTE);
          setErrors({});
        }}
        title="Create Off-Ramp Route"
        size="md"
        footer={
          <ButtonInput
            label={saving ? 'Creating…' : 'Create route'}
            variant="primary"
            onClick={handleAdd}
            loading={saving}
            disabled={saving}
            second={{
              label: 'Cancel',
              variant: 'secondary',
              onClick: () => {
                setAddOpen(false);
                setForm(EMPTY_ROUTE);
                setErrors({});
              },
            }}
          />
        }
      >
        <div className="space-y-3">
          <TextInput
            label="Label"
            value={form.label}
            onChange={set('label')}
            placeholder="e.g. main-chf"
            error={errors.label}
            note="Unique name for this route"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-input-label text-xs mb-2">Target Currency</div>
              <TabInput
                tabs={['CHF', 'EUR']}
                tab={form.targetCurrency}
                setTab={v => {
                  setForm(f => ({ ...f, targetCurrency: v as 'CHF' | 'EUR', bankAccountId: '' }));
                }}
              />
            </div>
            <div>
              <div
                className={`border-2 rounded-lg px-3 py-1 transition-colors border-input-border hover:border-text-secondary focus-within:!border-brand ${
                  errors.bankAccountId ? '!border-input-error' : ''
                }`}
              >
                <div className="text-input-label text-xs mt-1 mb-0.5">Bank Account</div>
                <select
                  value={form.bankAccountId}
                  onChange={e => set('bankAccountId')(e.target.value)}
                  className="w-full bg-transparent text-sm py-1.5 outline-none text-text-primary placeholder:text-input-empty"
                >
                  <option value="" className="bg-bg-primary">
                    {filteredBankAccounts.length === 0
                      ? `No ${form.targetCurrency} accounts`
                      : 'Select account…'}
                  </option>
                  {filteredBankAccounts.map(a => (
                    <option key={a.id} value={a.id} className="bg-bg-primary">
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
              {errors.bankAccountId && (
                <div className="px-3.5 mt-1 text-xs text-input-error">
                  {errors.bankAccountId}
                </div>
              )}
            </div>
          </div>
          <TextInput
            label="Min Trigger Amount"
            value={form.minTriggerAmount}
            onChange={set('minTriggerAmount')}
            placeholder="0"
            note="Minimum deposit amount to trigger conversion (optional)"
          />
        </div>
      </Modal>

      {/* Edit route modal */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Route"
        size="sm"
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
            placeholder="e.g. main-chf"
            error={editErrors.label}
            note="Unique name for this route"
          />
          <TextInput
            label="Min Trigger Amount"
            value={editForm.minTriggerAmount}
            onChange={setEdit('minTriggerAmount')}
            placeholder="0"
            note="Minimum deposit amount to trigger conversion"
          />
        </div>
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove Off-Ramp Route"
        message={
          <span>
            Remove route <strong>{deleteTarget?.label}</strong>? This will stop monitoring the
            deposit address.
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
