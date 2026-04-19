import { useEffect, useState, useCallback } from 'react';
import { faShield } from '@fortawesome/free-solid-svg-icons';
import { PageHeader, Section } from '@/components/ui/Layout';
import { showToast } from '@/components/ui';
import { Table, TableBody, TableHead, TableRow, TableRowEmpty, EditableCell } from '@/components/ui/Table';
import { apiRequest } from '@/lib/api/client';

interface TokenMinAmount {
  symbol: string;
  minAmount: string;
  updatedAt: string;
}

const HEADERS = ['Token', 'Min Amount', ''];

export default function TokenMinimumsSection() {
  const [tokens, setTokens] = useState<TokenMinAmount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSymbol, setEditingSymbol] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

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

  useEffect(() => { load(); }, [load]);

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
    <Section>
      <PageHeader
        title="Admin Settings"
        description="Global configuration for off-ramp token minimums"
        icon={faShield}
      />
      <Table>
        <TableHead
          headers={HEADERS}
          colSpan={HEADERS.length}
        />
        <TableBody>
          {loading ? (
            <TableRowEmpty>Loading…</TableRowEmpty>
          ) : tokens.length === 0 ? (
            <TableRowEmpty>No token minimums configured.</TableRowEmpty>
          ) : (
            tokens.map(t => (
              <TableRow
                key={t.symbol}
                headers={HEADERS}
                colSpan={HEADERS.length}
                rawHeader
              >
                <div className="font-mono font-medium">{t.symbol}</div>
                <EditableCell
                  value={t.minAmount}
                  isEditing={editingSymbol === t.symbol}
                  editValue={editValue}
                  onEdit={() => { setEditingSymbol(t.symbol); setEditValue(t.minAmount); }}
                  onSave={() => handleSave(t.symbol, t.minAmount)}
                  onCancel={() => setEditingSymbol(null)}
                  onChange={setEditValue}
                  placeholder="0"
                  maxLength={32}
                />
                <div />
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Section>
  );
}
