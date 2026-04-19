import { useEffect, useState, useCallback } from 'react';
import { faArrowTrendDown, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PageHeader, Section } from '@/components/ui/Layout';
import { ButtonInput, TextInput, TabInput } from '@/components/ui/Input';
import { Badge, Modal, AddressDisplay, showToast } from '@/components/ui';
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
import type { OffRampRoute, BankAccountRef } from './types';

const ROUTE_HEADERS = ['Deposit Address', 'Bank Account', 'Label', 'Status'];

const EMPTY_ROUTE = {
  label: '',
  targetCurrency: 'CHF' as 'CHF' | 'EUR',
  bankAccountId: '',
};

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  ACTIVE: { color: 'text-success', bg: 'bg-success-bg' },
  PAUSED: { color: 'text-text-muted', bg: 'bg-surface' },
};

const DEFAULT_STATUS_COLOR = { color: 'text-text-muted', bg: 'bg-surface' };

interface Props {
  isAdmin: boolean;
  hasScope: boolean;
  onRoutesLoaded?: (routes: OffRampRoute[]) => void;
}

export default function OffRampSection({ hasScope, onRoutesLoaded }: Props) {
  const [routes, setRoutes] = useState<OffRampRoute[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [bankAccounts, setBankAccounts] = useState<BankAccountRef[]>([]);

  const { sortTab: rSort, sortReverse: rRev, handleSort: handleRSort } = useSort('Deposit Address');

  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_ROUTE);
  const [errors, setErrors] = useState<Partial<typeof EMPTY_ROUTE>>({});

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

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
      await apiRequest('/offramp/routes', {
        method: 'POST',
        body: JSON.stringify({
          label: form.label.trim(),
          targetCurrency: form.targetCurrency,
          bankAccountId: form.bankAccountId,
        }),
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

  const handleLabelSave = async (route: OffRampRoute) => {
    const trimmed = editValue.trim();
    if (trimmed === route.label) {
      setEditingId(null);
      return;
    }
    try {
      await apiRequest(`/offramp/routes/${route.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ label: trimmed }),
      });
      showToast.success('Label updated');
      setEditingId(null);
      loadRoutes();
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message;
      showToast.error(msg || 'Failed to update label');
    }
  };

  const sortedRoutes = [...routes].sort((a, b) => {
    const m = rRev ? -1 : 1;
    switch (rSort) {
      case 'Bank Account':
        return m * a.bankAccount.label.localeCompare(b.bankAccount.label);
      case 'Status':
        return m * a.status.localeCompare(b.status);
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
              customColor="text-brand"
              customBgColor="bg-brand/10"
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
                    <div className="text-left">
                      <AddressDisplay
                        address={r.depositAddress}
                        prefixLength={6}
                        suffixLength={4}
                      />
                    </div>
                    <div className="text-right text-sm">{r.bankAccount.label}</div>
                    <EditableCell
                      value={r.label}
                      isEditing={editingId === r.id}
                      editValue={editValue}
                      onEdit={() => {
                        setEditingId(r.id);
                        setEditValue(r.label);
                      }}
                      onSave={() => handleLabelSave(r)}
                      onCancel={() => setEditingId(null)}
                      onChange={setEditValue}
                      placeholder="Add label…"
                      emptyText="—"
                      maxLength={64}
                    />
                    <div className="flex justify-end">
                      <Badge
                        text={r.status}
                        variant="custom"
                        customColor={(STATUS_COLORS[r.status] ?? DEFAULT_STATUS_COLOR).color}
                        customBgColor={(STATUS_COLORS[r.status] ?? DEFAULT_STATUS_COLOR).bg}
                        size="sm"
                      />
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
                  errors.bankAccountId ? '!border-error' : ''
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
                <div className="px-3.5 mt-1 text-xs text-error">{errors.bankAccountId}</div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
