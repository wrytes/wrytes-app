import { useEffect, useState, useCallback } from 'react';
import { faShield, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PageHeader, Section } from '@/components/ui/Layout';
import { ButtonInput, TextInput } from '@/components/ui/Input';
import { Modal, showToast } from '@/components/ui';
import {
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableRowEmpty,
  EditableCell,
} from '@/components/ui/Table';
import { apiRequest } from '@/lib/api/client';

interface TokenMinAmount {
  symbol: string;
  minAmount: string;
  updatedAt: string;
}

const HEADERS = ['Token', 'Min Amount', 'Updated'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const EMPTY_FORM = { symbol: '', minAmount: '' };

export default function TokenMinimumsSection() {
  const [tokens, setTokens] = useState<TokenMinAmount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<typeof EMPTY_FORM>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<TokenMinAmount[]>('/admin/settings/token-minimums');
      setTokens(Array.isArray(data) ? data : []);
    } catch {
      showToast.error('Failed to load token minimums');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (field: keyof typeof EMPTY_FORM) => (value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const validate = () => {
    const e: Partial<typeof EMPTY_FORM> = {};
    if (!form.symbol.trim()) e.symbol = 'Required';
    if (!form.minAmount.trim()) e.minAmount = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await apiRequest('/admin/settings/token-minimums', {
        method: 'POST',
        body: JSON.stringify({
          symbol: form.symbol.trim().toUpperCase(),
          minAmount: form.minAmount.trim(),
        }),
      });
      showToast.success(`${form.symbol.toUpperCase()} minimum added`);
      setAddOpen(false);
      setForm(EMPTY_FORM);
      setErrors({});
      load();
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message;
      showToast.error(msg || 'Failed to add token minimum');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (symbol: string, current: string) => {
    const trimmed = editValue.trim();
    if (trimmed === current) {
      setEditingSymbol(null);
      return;
    }
    try {
      await apiRequest(`/admin/settings/token-minimums/${symbol}`, {
        method: 'PUT',
        body: JSON.stringify({ minAmount: trimmed }),
      });
      showToast.success(`${symbol} minimum updated`);
      setEditingSymbol(null);
      load();
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message;
      showToast.error(msg || 'Failed to update minimum');
    }
  };

  return (
    <>
      <Section>
        <PageHeader
          title="Token Minimums"
          description="Global minimum amounts for off-ramp token conversions"
          icon={faShield}
          actions={
            <ButtonInput
              label="Add token"
              icon={<FontAwesomeIcon icon={faPlus} />}
              variant="primary"
              size="sm"
              onClick={() => setAddOpen(true)}
            />
          }
        />
        <Table>
          <TableHead headers={HEADERS} colSpan={HEADERS.length} />
          <TableBody>
            {loading ? (
              <TableRowEmpty>Loading…</TableRowEmpty>
            ) : tokens.length === 0 ? (
              <TableRowEmpty>No token minimums configured.</TableRowEmpty>
            ) : (
              tokens.map(t => (
                <TableRow key={t.symbol} headers={HEADERS} colSpan={HEADERS.length} rawHeader>
                  <div className="font-mono font-medium text-left">{t.symbol}</div>
                  <EditableCell
                    value={t.minAmount}
                    isEditing={editingSymbol === t.symbol}
                    editValue={editValue}
                    onEdit={() => {
                      setEditingSymbol(t.symbol);
                      setEditValue(t.minAmount);
                    }}
                    onSave={() => handleSave(t.symbol, t.minAmount)}
                    onCancel={() => setEditingSymbol(null)}
                    onChange={setEditValue}
                    placeholder="0"
                    maxLength={32}
                  />
                  <div className="text-right text-sm">{formatDate(t.updatedAt)}</div>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Section>

      <Modal
        isOpen={addOpen}
        onClose={() => {
          setAddOpen(false);
          setForm(EMPTY_FORM);
          setErrors({});
        }}
        title="Add Token Minimum"
        size="sm"
        footer={
          <ButtonInput
            label={saving ? 'Adding…' : 'Add token'}
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
            label="Symbol"
            value={form.symbol}
            onChange={v => set('symbol')(v.toUpperCase())}
            placeholder="ETH"
            error={errors.symbol}
          />
          <TextInput
            label="Min Amount"
            value={form.minAmount}
            onChange={set('minAmount')}
            placeholder="0.001"
            error={errors.minAmount}
          />
        </div>
      </Modal>
    </>
  );
}
