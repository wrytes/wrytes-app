import { useEffect, useState, useCallback } from 'react';
import { faClockRotateLeft, faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PageHeader, Section } from '@/components/ui/Layout';
import { ButtonInput, TextInput } from '@/components/ui/Input';
import { Badge, Modal, showToast } from '@/components/ui';
import { Table, TableBody, TableHead, TableRow, TableRowEmpty } from '@/components/ui/Table';
import { useSort } from '@/hooks/useSort';
import { apiRequest } from '@/lib/api/client';
import type { OffRampRoute, OffRampExecution } from './types';

const EXEC_HEADERS = ['Date', 'Route', 'Token', 'Amount', 'Fiat', 'Status', 'Actions'];

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  SETTLED: { color: 'text-green-400', bg: 'bg-green-400/10' },
  FAILED: { color: 'text-red-400', bg: 'bg-red-400/10' },
  PENDING_BANK_TRANSFER: { color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
};

const DEFAULT_STATUS_COLOR = { color: 'text-gray-400', bg: 'bg-gray-400/10' };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface Props {
  isAdmin: boolean;
  hasScope: boolean;
  routes: OffRampRoute[];
}

export default function ExecutionHistorySection({ isAdmin, hasScope, routes }: Props) {
  const [executions, setExecutions] = useState<OffRampExecution[]>([]);
  const [loadingExec, setLoadingExec] = useState(true);
  const { sortTab: eSort, sortReverse: eRev, handleSort: handleESort } = useSort('Date');

  const [settleTarget, setSettleTarget] = useState<OffRampExecution | null>(null);
  const [settleRef, setSettleRef] = useState('');
  const [settling, setSettling] = useState(false);

  const loadExecutions = useCallback(async () => {
    if (!hasScope) {
      setLoadingExec(false);
      return;
    }
    setLoadingExec(true);
    try {
      const data = await apiRequest<OffRampExecution[]>('/offramp/executions');
      setExecutions(Array.isArray(data) ? data : []);
    } catch {
      showToast.error('Failed to load executions');
    } finally {
      setLoadingExec(false);
    }
  }, [hasScope]);

  useEffect(() => {
    loadExecutions();
  }, [loadExecutions]);

  const routeMap = Object.fromEntries(routes.map(r => [r.id, r]));

  const handleSettle = async () => {
    if (!settleTarget) return;
    setSettling(true);
    try {
      const body: Record<string, string> = {};
      if (settleRef.trim()) body.bankTransferRef = settleRef.trim();
      await apiRequest(`/offramp/executions/${settleTarget.id}/settle`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      showToast.success('Execution settled');
      setSettleTarget(null);
      setSettleRef('');
      loadExecutions();
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message;
      showToast.error(msg || 'Failed to settle execution');
    } finally {
      setSettling(false);
    }
  };

  const sortedExec = [...executions].sort((a, b) => {
    const m = eRev ? -1 : 1;
    switch (eSort) {
      case 'Route':
        return (
          m * (routeMap[a.routeId]?.label ?? '').localeCompare(routeMap[b.routeId]?.label ?? '')
        );
      case 'Token':
        return m * a.tokenSymbol.localeCompare(b.tokenSymbol);
      case 'Amount':
        return m * (Number(a.tokenAmount) - Number(b.tokenAmount));
      case 'Fiat':
        return m * (Number(a.fiatAmount ?? 0) - Number(b.fiatAmount ?? 0));
      case 'Status':
        return m * a.status.localeCompare(b.status);
      default:
        return m * new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  if (!hasScope) return null;

  return (
    <>
      <Section>
        <PageHeader
          title="Execution History"
          description="Recent off-ramp conversions and their status"
          icon={faClockRotateLeft}
        />
        <Table>
          <TableHead
            headers={EXEC_HEADERS}
            colSpan={EXEC_HEADERS.length}
            tab={eSort}
            reverse={eRev}
            tabOnChange={handleESort}
          />
          <TableBody>
            {loadingExec ? (
              <TableRowEmpty>Loading…</TableRowEmpty>
            ) : sortedExec.length === 0 ? (
              <TableRowEmpty>No executions yet.</TableRowEmpty>
            ) : (
              sortedExec.map(ex => {
                const sc = STATUS_COLORS[ex.status] ?? DEFAULT_STATUS_COLOR;
                return (
                  <TableRow
                    key={ex.id}
                    headers={EXEC_HEADERS}
                    colSpan={EXEC_HEADERS.length}
                    tab={eSort}
                    rawHeader
                  >
                    <div className="text-left text-text-secondary text-sm">
                      {formatDate(ex.createdAt)}
                    </div>
                    <div className="text-right text-text-secondary text-sm">
                      {routeMap[ex.routeId]?.label ?? '—'}
                    </div>
                    <div className="text-right font-medium text-text-primary text-sm">
                      {ex.tokenSymbol}
                    </div>
                    <div className="text-right font-mono text-text-secondary text-sm">
                      {ex.tokenAmount}
                    </div>
                    <div className="text-right font-mono text-text-secondary text-sm">
                      {ex.fiatAmount ? `${ex.fiatAmount}` : '—'}
                    </div>
                    <div className="flex justify-end">
                      <Badge
                        text={ex.status.replace(/_/g, ' ')}
                        variant="custom"
                        customColor={sc.color}
                        customBgColor={sc.bg}
                        size="sm"
                      />
                    </div>
                    <div className="flex justify-end items-center gap-2">
                      {isAdmin && ex.status === 'PENDING_BANK_TRANSFER' && (
                        <button
                          onClick={() => {
                            setSettleTarget(ex);
                            setSettleRef('');
                          }}
                          className="text-xs text-green-500 hover:text-green-400 transition-colors flex items-center gap-1"
                        >
                          <FontAwesomeIcon icon={faCheck} className="text-xs" />
                          Settle
                        </button>
                      )}
                    </div>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Section>

      {/* Settle execution modal */}
      <Modal
        isOpen={!!settleTarget}
        onClose={() => setSettleTarget(null)}
        title="Settle Execution"
        size="sm"
        footer={
          <ButtonInput
            label={settling ? 'Settling…' : 'Mark as settled'}
            variant="primary"
            onClick={handleSettle}
            loading={settling}
            disabled={settling}
            second={{
              label: 'Cancel',
              variant: 'secondary',
              onClick: () => setSettleTarget(null),
            }}
          />
        }
      >
        <TextInput
          label="Bank Transfer Reference"
          value={settleRef}
          onChange={setSettleRef}
          placeholder="e.g. PF-2024-123456"
          note="Optional PostFinance or bank reference"
        />
      </Modal>
    </>
  );
}
