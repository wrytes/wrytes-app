import { useState, useMemo, useCallback, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import {
  Table,
  TableBody,
  TableHead,
  TableHeadSearchable,
  TableRow,
  TableRowEmpty,
} from '@/components/ui/Table';
import { EditableCell } from '@/components/ui/Table/EditableCell';
import { apiRequest } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/format-handling';
import { useSort } from '@/hooks/useSort';
import type { Transfer, TransferClassification, CounterpartyLabelMap } from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HEADERS = ['Date', 'Counterparty', 'Amount', 'Value', 'Note', 'Classification'];

const CLASSIFICATION_OPTIONS: { label: string; value: TransferClassification }[] = [
  { label: 'Unclassified', value: 'UNCLASSIFIED' },
  { label: 'Neutral',      value: 'NEUTRAL'      },
  { label: 'Capital',      value: 'CAPITAL'      },
  { label: 'Income',       value: 'INCOME'       },
  { label: 'Swap In',      value: 'SWAP_IN'      },
  { label: 'Loan',         value: 'LOAN'         },
  { label: 'Repayment',    value: 'REPAYMENT'    },
  { label: 'Swap Out',     value: 'SWAP_OUT'     },
  { label: 'Expense',      value: 'EXPENSE'      },
  { label: 'Payment',      value: 'PAYMENT'      },
];

const CLASSIFICATION_LABEL: Partial<Record<TransferClassification, string>> = Object.fromEntries(
  CLASSIFICATION_OPTIONS.map(o => [o.value, o.label])
);

type ClassStyle = { color: string; bg: string };

const CLASSIFICATION_STYLE: Partial<Record<TransferClassification, ClassStyle>> = {
  CAPITAL:      { color: 'text-success',    bg: 'bg-success-bg' },
  INCOME:       { color: 'text-success',    bg: 'bg-success-bg' },
  SWAP_IN:      { color: 'text-success',    bg: 'bg-success-bg' },
  LOAN:         { color: 'text-info',       bg: 'bg-info/10'    },
  REPAYMENT:    { color: 'text-brand',      bg: 'bg-brand/10'   },
  SWAP_OUT:     { color: 'text-warning',    bg: 'bg-warning/10' },
  EXPENSE:      { color: 'text-error',      bg: 'bg-error-bg'   },
  PAYMENT:      { color: 'text-error',      bg: 'bg-error-bg'   },
  NEUTRAL:      { color: 'text-text-muted', bg: 'bg-surface'    },
  UNCLASSIFIED: { color: 'text-warning',    bg: 'bg-warning/10' },
  ASSET:        { color: 'text-success',    bg: 'bg-success-bg' },
  RECEIVED:     { color: 'text-success',    bg: 'bg-success-bg' },
  LIABILITY:    { color: 'text-info',       bg: 'bg-info/10'    },
  TRANSFER:     { color: 'text-text-muted', bg: 'bg-surface'    },
  SKIPPED:      { color: 'text-text-muted', bg: 'bg-surface'    },
};

function getStyle(cls: TransferClassification): ClassStyle {
  return CLASSIFICATION_STYLE[cls] ?? { color: 'text-text-secondary', bg: 'bg-surface' };
}

const EXPLORER_BASE: Record<number, string> = {
  1: 'https://etherscan.io',
  8453: 'https://basescan.org',
  42161: 'https://arbiscan.io',
  10: 'https://optimistic.etherscan.io',
  137: 'https://polygonscan.com',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtNum(n: number, decimals = 2) {
  return formatCurrency(n, decimals, decimals) ?? '0';
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-CH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function shortenAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function counterpartyAddress(t: Transfer): string {
  return (t.direction === 'IN' ? t.fromAddress : (t.toAddress ?? t.fromAddress)).toLowerCase();
}

// ---------------------------------------------------------------------------
// TransfersTable
// ---------------------------------------------------------------------------

interface Props {
  transfers: Transfer[];
  loading: boolean;
  chainId: number;
  isExporting: boolean;
  onUpdate: (id: string, patch: { classification?: string; chfValue?: string | null; notes?: string | null }) => Promise<void>;
}

export function TransfersTable({ transfers, loading, chainId, isExporting, onUpdate }: Props) {
  const { sortTab, sortReverse, handleSort } = useSort('Date');
  const [search, setSearch] = useState('');
  const [classFilters, setClassFilters] = useState<string[]>([]);
  const [chfEditing, setChfEditing] = useState<{ id: string; value: string } | null>(null);
  const [noteEditing, setNoteEditing] = useState<{ id: string; value: string } | null>(null);

  // Counterparty labels
  const [labels, setLabels] = useState<CounterpartyLabelMap>({});
  const [labelEditing, setLabelEditing] = useState<{ addr: string; value: string } | null>(null);

  useEffect(() => {
    void apiRequest<CounterpartyLabelMap>('/accounting/counterparty-labels')
      .then(setLabels)
      .catch(() => {});
  }, []);

  const handleSaveLabel = useCallback(async (addr: string, label: string) => {
    const trimmed = label.trim() || null;
    await apiRequest('/accounting/counterparty-labels', {
      method: 'POST',
      body: JSON.stringify({ address: addr, label: trimmed }),
    });
    setLabels(prev => {
      if (!trimmed) { const next = { ...prev }; delete next[addr]; return next; }
      return { ...prev, [addr]: trimmed };
    });
    setLabelEditing(null);
  }, []);

  const visible = useMemo(() => {
    const q = search.toLowerCase().trim();
    return [...transfers]
      .filter(t => {
        if (classFilters.length > 0 && !classFilters.includes(t.classification)) return false;
        if (!q) return true;
        const addr = counterpartyAddress(t);
        const lbl = labels[addr] ?? '';
        return (
          lbl.toLowerCase().includes(q) ||
          addr.includes(q) ||
          (t.tokenSymbol ?? '').toLowerCase().includes(q) ||
          t.txHash.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const m = sortReverse ? -1 : 1;
        switch (sortTab) {
          case 'Counterparty': {
            const la = labels[counterpartyAddress(a)] ?? counterpartyAddress(a);
            const lb = labels[counterpartyAddress(b)] ?? counterpartyAddress(b);
            return m * la.localeCompare(lb);
          }
          case 'Amount':
            return m * (parseFloat(a.amountFormatted ?? '0') - parseFloat(b.amountFormatted ?? '0'));
          case 'Value':
            return m * (parseFloat(a.chfValue ?? '0') - parseFloat(b.chfValue ?? '0'));
          case 'Classification':
            return m * a.classification.localeCompare(b.classification);
          default: { // Date — ascending; logIndex as tiebreaker within same tx
            const tDiff = new Date(a.timestamp ?? 0).getTime() - new Date(b.timestamp ?? 0).getTime();
            if (tDiff !== 0) return m * tDiff;
            const bDiff = (a.blockNumber ?? 0) - (b.blockNumber ?? 0);
            if (bDiff !== 0) return m * bDiff;
            return m * ((a.logIndex ?? 0) - (b.logIndex ?? 0));
          }
        }
      });
  }, [transfers, search, classFilters, labels, sortTab, sortReverse]);

  const handleSaveChf = async () => {
    if (!chfEditing) return;
    await onUpdate(chfEditing.id, { chfValue: chfEditing.value.trim() || null });
    setChfEditing(null);
  };

  const handleSaveNote = async () => {
    if (!noteEditing) return;
    await onUpdate(noteEditing.id, { notes: noteEditing.value.trim() || null });
    setNoteEditing(null);
  };

  return (
    <Table>
      {isExporting ? (
        <TableHead headers={HEADERS} colSpan={HEADERS.length} />
      ) : (
        <TableHeadSearchable
          headers={HEADERS}
          colSpan={HEADERS.length}
          tab={sortTab}
          reverse={sortReverse}
          tabOnChange={handleSort}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by counterparty, token or tx hash…"
          hideMyWallet
          inMyWallet={false}
          onInMyWalletChange={() => {}}
          filterOptionsTitle="Classification"
          filterOptions={CLASSIFICATION_OPTIONS.map(o => ({ label: o.label, value: o.value }))}
          activeFilters={classFilters}
          onFiltersChange={setClassFilters}
        />
      )}
      <TableBody>
        {loading ? (
          <TableRowEmpty>Loading transfers…</TableRowEmpty>
        ) : visible.length === 0 ? (
          <TableRowEmpty>
            {transfers.length === 0
              ? 'No transfers yet — click Sync on the address above.'
              : 'No transfers match your filter.'}
          </TableRowEmpty>
        ) : (
          visible.map(t => {
            const cls = getStyle(t.classification);
            const isIn = t.direction === 'IN';
            const txUrl = EXPLORER_BASE[chainId] ? `${EXPLORER_BASE[chainId]}/tx/${t.txHash}` : null;
            const addr = counterpartyAddress(t);
            const existingLabel = labels[addr] ?? null;
            const isEditingLabel = labelEditing?.addr === addr;

            return (
              <TableRow key={t.id} headers={HEADERS} colSpan={HEADERS.length} rawHeader>
                {/* Date */}
                <div className="text-left">
                  {txUrl && !isExporting ? (
                    <a
                      href={txUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand transition-colors"
                      onClick={e => e.stopPropagation()}
                    >
                      {formatDate(t.timestamp)}
                      <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-2.5 h-2.5 opacity-60" />
                    </a>
                  ) : (
                    <span className="text-sm text-text-secondary">{formatDate(t.timestamp)}</span>
                  )}
                </div>

                {/* Counterparty */}
                <div onClick={e => e.stopPropagation()}>
                  {isExporting ? (
                    <div className="text-right">
                      {existingLabel ? (
                        <span className="text-sm font-medium text-text-primary">{existingLabel}</span>
                      ) : (
                        <span className="text-xs text-text-muted font-mono">{shortenAddr(addr)}</span>
                      )}
                    </div>
                  ) : (
                    <EditableCell
                      value={existingLabel}
                      isEditing={isEditingLabel}
                      editValue={isEditingLabel ? labelEditing!.value : ''}
                      onEdit={() => setLabelEditing({ addr, value: existingLabel ?? '' })}
                      onSave={() => handleSaveLabel(addr, labelEditing?.value ?? '')}
                      onCancel={() => setLabelEditing(null)}
                      onChange={v => setLabelEditing({ addr, value: v })}
                      emptyText={shortenAddr(addr)}
                      placeholder="e.g. Morpho, Alice…"
                    />
                  )}
                </div>

                {/* Amount */}
                <div className="text-right">
                  <span className={`text-sm font-semibold tabular-nums ${isIn ? 'text-success' : 'text-error'}`}>
                    {isIn ? '+' : '−'}
                    {fmtNum(parseFloat(t.amountFormatted ?? '0'), 6)}
                    <span className="font-normal text-text-muted ml-1 text-xs">{t.tokenSymbol}</span>
                  </span>
                </div>

                {/* Value (CHF) — sign and colour driven by direction, input stays positive */}
                {isExporting ? (
                  <div className="text-right">
                    <span className={`text-sm font-semibold tabular-nums ${t.chfValue ? (isIn ? 'text-success' : 'text-error') : 'text-text-muted'}`}>
                      {t.chfValue ? `${isIn ? '+' : '−'}CHF ${fmtNum(parseFloat(t.chfValue))}` : '—'}
                    </span>
                  </div>
                ) : (
                  <div onClick={e => e.stopPropagation()}>
                    <EditableCell
                      value={t.chfValue ? `${isIn ? '+' : '−'}CHF ${fmtNum(parseFloat(t.chfValue))}` : null}
                      isEditing={chfEditing?.id === t.id}
                      editValue={chfEditing?.id === t.id ? chfEditing.value : ''}
                      onEdit={() => setChfEditing({ id: t.id, value: t.chfValue ?? '' })}
                      onSave={handleSaveChf}
                      onCancel={() => setChfEditing(null)}
                      onChange={v => setChfEditing({ id: t.id, value: v })}
                      placeholder="0.00"
                      emptyText="Set value"
                      valueClassName={`font-semibold ${isIn ? 'text-success' : 'text-error'}`}
                    />
                  </div>
                )}

                {/* Note */}
                {isExporting ? (
                  <div className="text-right">
                    <span className="text-sm text-text-secondary">
                      {t.notes ?? '—'}
                    </span>
                  </div>
                ) : (
                  <div onClick={e => e.stopPropagation()}>
                    <EditableCell
                      value={t.notes ?? null}
                      isEditing={noteEditing?.id === t.id}
                      editValue={noteEditing?.id === t.id ? noteEditing.value : ''}
                      onEdit={() => setNoteEditing({ id: t.id, value: t.notes ?? '' })}
                      onSave={handleSaveNote}
                      onCancel={() => setNoteEditing(null)}
                      onChange={v => setNoteEditing({ id: t.id, value: v })}
                      placeholder="Add note…"
                      emptyText="Add note"
                      maxLength={200}
                    />
                  </div>
                )}

                {/* Classification */}
                {isExporting ? (
                  <div className="flex justify-end">
                    <span className={`text-xs font-medium ${cls.color}`}>
                      {CLASSIFICATION_LABEL[t.classification] ?? t.classification}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-end min-w-0" onClick={e => e.stopPropagation()}>
                    <select
                      value={t.classification}
                      onChange={e => onUpdate(t.id, { classification: e.target.value })}
                      className={`text-xs rounded-lg px-2 py-1 border-transparent outline-none cursor-pointer max-w-full ${cls.bg} ${cls.color}`}
                    >
                      {CLASSIFICATION_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
