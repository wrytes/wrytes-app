import { useEffect, useState, useCallback } from 'react';
import { faClockRotateLeft, faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { PageHeader, Section } from '@/components/ui/Layout';
import { ButtonInput, TextInput } from '@/components/ui/Input';
import { Badge, Modal, showToast } from '@/components/ui';
import { DetailRow } from '@/components/ui/Modal';
import { TokenLogo, FiatLogo } from '@/components/ui/logo';
import {
  AssetCell,
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableRowEmpty,
} from '@/components/ui/Table';
import { useSort } from '@/hooks/useSort';
import { apiRequest } from '@/lib/api/client';
import { formatCurrency, FormatType } from '@/lib/utils/format-handling';
import { DEFAULT_FIAT_CURRENCY } from '@/lib/currencies';
import type { OffRampRoute, OffRampExecution } from './types';

const EXEC_HEADERS = ['Date', 'Route', 'Input', 'Output', 'Status'];

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  SETTLED: { color: 'text-success', bg: 'bg-success-bg' },
  FAILED: { color: 'text-error', bg: 'bg-error-bg' },
  PENDING_BANK_TRANSFER: { color: 'text-warning', bg: 'bg-warning/10' },
};

const DEFAULT_STATUS_COLOR = { color: 'text-text-muted', bg: 'bg-surface' };

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

  const [detailTarget, setDetailTarget] = useState<OffRampExecution | null>(null);
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
      case 'Input':
        return m * (Number(a.depositTokenAmount) - Number(b.depositTokenAmount));
      case 'Output':
        return (
          m *
          (Number(a.krakenWithdrawAmount ?? a.krakenFiatAmount ?? 0) -
            Number(b.krakenWithdrawAmount ?? b.krakenFiatAmount ?? 0))
        );
      case 'Status':
        return m * a.status.localeCompare(b.status);
      default:
        return m * (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  });

  return (
    <>
      <Section>
        <PageHeader
          title="Execution History"
          description="Recent off-ramp conversions and their status"
          icon={faClockRotateLeft}
        />
        {!hasScope ? (
          <p className="text-text-secondary text-sm">
            Execution history requires the{' '}
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
                  const route = routeMap[ex.routeId];
                  const fiatCurrency = route?.targetCurrency ?? DEFAULT_FIAT_CURRENCY;
                  return (
                    <TableRow
                      key={ex.id}
                      headers={EXEC_HEADERS}
                      colSpan={EXEC_HEADERS.length}
                      tab={eSort}
                      rawHeader
                      onClick={() => setDetailTarget(ex)}
                    >
                      <div className="text-left text-sm">{formatDate(ex.createdAt)}</div>
                      <div className="text-right text-sm">{route?.label ?? '—'}</div>
                      <AssetCell
                        logo={<TokenLogo currency={ex.depositTokenSymbol} size={4} />}
                        symbol={ex.depositTokenSymbol}
                        amount={
                          formatCurrency(ex.depositTokenAmount, 2, 2, FormatType.us) ??
                          ex.depositTokenAmount
                        }
                      />
                      <div className="flex items-center justify-end gap-1.5">
                        {(() => {
                          const displayAmount = ex.krakenWithdrawAmount ?? ex.krakenFiatAmount;
                          return displayAmount ? (
                            <AssetCell
                              logo={<FiatLogo symbol={fiatCurrency} size={4} />}
                              symbol={fiatCurrency}
                              amount={
                                formatCurrency(displayAmount, 2, 2, FormatType.us) ?? displayAmount
                              }
                            />
                          ) : (
                            <span className="text-sm">—</span>
                          );
                        })()}
                      </div>
                      <div className="flex justify-end items-center gap-3">
                        <Badge
                          text={ex.status.replace(/_/g, ' ')}
                          variant="custom"
                          customColor={sc.color}
                          customBgColor={sc.bg}
                          size="sm"
                        />
                        {isAdmin && ex.status === 'PENDING_BANK_TRANSFER' && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              setSettleTarget(ex);
                              setSettleRef('');
                            }}
                            className="text-xs text-success hover:text-success/80 transition-colors flex items-center gap-1"
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
        )}
      </Section>

      {/* Detail modal */}
      {detailTarget &&
        (() => {
          const dr = routeMap[detailTarget.routeId];
          const fiatCcy =
            detailTarget.krakenFiatCurrency ?? dr?.targetCurrency ?? DEFAULT_FIAT_CURRENCY;
          const sc = STATUS_COLORS[detailTarget.status] ?? DEFAULT_STATUS_COLOR;
          return (
            <Modal
              isOpen={!!detailTarget}
              onClose={() => setDetailTarget(null)}
              title="Execution Detail"
              size="md"
              footer={
                <ButtonInput
                  label="Close"
                  variant="secondary"
                  onClick={() => setDetailTarget(null)}
                />
              }
            >
              <div className="space-y-3 text-sm">
                <DetailRow label="ID" value={detailTarget.id} mono />
                <DetailRow label="Date" value={formatDate(detailTarget.createdAt)} />
                <DetailRow label="Route" value={dr?.label ?? detailTarget.routeId} />
                <DetailRow label="Status">
                  <Badge
                    text={detailTarget.status.replace(/_/g, ' ')}
                    variant="custom"
                    customColor={sc.color}
                    customBgColor={sc.bg}
                    size="sm"
                  />
                </DetailRow>
                <DetailRow label="Deposit">
                  <AssetCell
                    logo={<TokenLogo currency={detailTarget.depositTokenSymbol} size={4} />}
                    symbol={detailTarget.depositTokenSymbol}
                    amount={
                      formatCurrency(detailTarget.depositTokenAmount, 2, 6, FormatType.us) ??
                      detailTarget.depositTokenAmount
                    }
                  />
                </DetailRow>
                {detailTarget.krakenTokenSymbol &&
                  detailTarget.krakenTokenSymbol !== detailTarget.depositTokenSymbol && (
                    <DetailRow label="Converted To">
                      <AssetCell
                        logo={<TokenLogo currency={detailTarget.krakenTokenSymbol} size={4} />}
                        symbol={detailTarget.krakenTokenSymbol}
                        amount={
                          formatCurrency(
                            detailTarget.krakenTokenAmount ?? '0',
                            2,
                            6,
                            FormatType.us
                          ) ??
                          detailTarget.krakenTokenAmount ??
                          '—'
                        }
                      />
                    </DetailRow>
                  )}
                {detailTarget.krakenFiatAmount && (
                  <DetailRow label="Kraken Output">
                    <AssetCell
                      logo={<FiatLogo symbol={fiatCcy} size={4} />}
                      symbol={fiatCcy}
                      amount={
                        formatCurrency(detailTarget.krakenFiatAmount, 2, 2, FormatType.us) ??
                        detailTarget.krakenFiatAmount
                      }
                    />
                  </DetailRow>
                )}
                {detailTarget.krakenWithdrawFee && (
                  <DetailRow label="Withdrawal Fee">
                    <AssetCell
                      logo={<FiatLogo symbol={fiatCcy} size={4} />}
                      symbol={fiatCcy}
                      amount={
                        formatCurrency(detailTarget.krakenWithdrawFee, 2, 4, FormatType.us) ??
                        detailTarget.krakenWithdrawFee
                      }
                    />
                  </DetailRow>
                )}
                {(detailTarget.krakenWithdrawAmount ?? detailTarget.krakenFiatAmount) && (
                  <DetailRow label="Withdraw Amount">
                    <AssetCell
                      logo={<FiatLogo symbol={fiatCcy} size={4} />}
                      symbol={fiatCcy}
                      amount={
                        formatCurrency(
                          detailTarget.krakenWithdrawAmount ?? detailTarget.krakenFiatAmount!,
                          2,
                          2,
                          FormatType.us
                        ) ??
                        detailTarget.krakenWithdrawAmount ??
                        detailTarget.krakenFiatAmount!
                      }
                    />
                  </DetailRow>
                )}
                {detailTarget.bankTransferRef && (
                  <DetailRow label="Bank Ref" value={detailTarget.bankTransferRef} mono />
                )}
                {detailTarget.error && (
                  <DetailRow label="Error">
                    <pre className="text-error text-xs overflow-x-auto whitespace-pre font-mono">{detailTarget.error}</pre>
                  </DetailRow>
                )}
              </div>
            </Modal>
          );
        })()}

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
