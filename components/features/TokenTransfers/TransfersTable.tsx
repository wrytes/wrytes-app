import { useState, useMemo, useCallback, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import {
  Table,
  TableBody,
  TableHeadSearchable,
  TableRow,
  TableRowEmpty,
} from '@/components/ui/Table';
import { EditableCell } from '@/components/ui/Table/EditableCell';
import { apiRequest } from '@/lib/api/client';
import { formatCurrency, sanitizeNumericInput } from '@/lib/utils/format-handling';
import { useSort } from '@/hooks/useSort';
import { useAddressColors } from '@/hooks/redux/useAddressColors';
import { ADDRESS_COLOR_CLASSES } from './addressColors';
import type { TransferWithAddress, TransferClassification, CounterpartyLabelMap, WalletAddress } from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HEADERS = ['Date', 'Counterparty', 'Amount', 'Value', 'Note', 'Classification'];

const CLASSIFICATION_OPTIONS: { label: string; value: TransferClassification }[] = [
  { label: 'Unclassified', value: 'UNCLASSIFIED' },
  { label: 'Neutral',      value: 'NEUTRAL'      },
  { label: 'Capital',      value: 'CAPITAL'      },
  { label: 'Loan',         value: 'LOAN'         },
  { label: 'Income',       value: 'INCOME'       },
  { label: 'Expense',      value: 'EXPENSE'      },
  { label: 'Swap Out',     value: 'SWAP_OUT'     },
  { label: 'Swap In',      value: 'SWAP_IN'      },
  { label: 'Payment',      value: 'PAYMENT'      },
  { label: 'Received',     value: 'RECEIVED'     },
];


type ClassStyle = { color: string; bg: string };

const CLASSIFICATION_STYLE: Partial<Record<TransferClassification, ClassStyle>> = {
  CAPITAL:      { color: 'text-success',    bg: 'bg-success-bg' },
  LOAN:         { color: 'text-info',       bg: 'bg-info/10'    },
  INCOME:       { color: 'text-success',    bg: 'bg-success-bg' },
  EXPENSE:      { color: 'text-error',      bg: 'bg-error-bg'   },
  SWAP_OUT:     { color: 'text-warning',    bg: 'bg-warning/10' },
  SWAP_IN:      { color: 'text-success',    bg: 'bg-success-bg' },
  PAYMENT:      { color: 'text-error',      bg: 'bg-error-bg'   },
  RECEIVED:     { color: 'text-success',    bg: 'bg-success-bg' },
  NEUTRAL:      { color: 'text-text-muted', bg: 'bg-surface'    },
  UNCLASSIFIED: { color: 'text-warning',    bg: 'bg-warning/10' },
  // legacy
  ASSET:        { color: 'text-success',    bg: 'bg-success-bg' },
  REPAYMENT:    { color: 'text-brand',      bg: 'bg-brand/10'   },
  LIABILITY:    { color: 'text-info',       bg: 'bg-info/10'    },
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

function fmtAmount(n: number) {
  return formatCurrency(n, 2, 6) ?? '0';
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

function counterpartyAddress(t: TransferWithAddress): string {
  return (t.direction === 'IN' ? t.fromAddress : (t.toAddress ?? t.fromAddress)).toLowerCase();
}

// ---------------------------------------------------------------------------
// TransfersTable
// ---------------------------------------------------------------------------

interface Props {
  transfers: TransferWithAddress[];
  addresses: WalletAddress[];
  loading: boolean;
  onUpdate: (id: string, patch: { classification?: string; chfValue?: string | null; notes?: string | null }) => Promise<void>;
}

export function TransfersTable({ transfers, addresses, loading, onUpdate }: Props) {
  const { sortTab, sortReverse, handleSort } = useSort('Date');
  const [search, setSearch] = useState('');
  const [classFilters, setClassFilters] = useState<string[]>([]);
  const [chfEditing, setChfEditing] = useState<{ id: string; value: string } | null>(null);
  const [noteEditing, setNoteEditing] = useState<{ id: string; value: string } | null>(null);

  const { colorFor } = useAddressColors();
  const addressLabel = useCallback(
    (id: string) => {
      const a = addresses.find(a => a.id === id);
      if (!a) return '—';
      return a.label ?? shortenAddr(a.address);
    },
    [addresses]
  );

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
          t.txHash.toLowerCase().includes(q) ||
          (t.notes ?? '').toLowerCase().includes(q)
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
            const lDiff = (a.logIndex ?? 0) - (b.logIndex ?? 0);
            if (lDiff !== 0) return m * lDiff;
            // Same on-chain event recorded on both sides of a transfer between two
            // tracked addresses — show the outgoing leg before the incoming leg,
            // regardless of ascending/descending, since it's a narrative order (send
            // causes receive), not a magnitude to reverse.
            if (a.direction !== b.direction) return a.direction === 'OUT' ? -1 : 1;
            return 0;
          }
        }
      });
  }, [transfers, search, classFilters, labels, sortTab, sortReverse]);

  const handleSaveChf = async () => {
    if (!chfEditing) return;
    await onUpdate(chfEditing.id, { chfValue: sanitizeNumericInput(chfEditing.value.trim()) || null });
    setChfEditing(null);
  };

  const handleClearChf = async (id: string) => {
    await onUpdate(id, { chfValue: null });
    setChfEditing(null);
  };

  const handleSaveNote = async () => {
    if (!noteEditing) return;
    await onUpdate(noteEditing.id, { notes: noteEditing.value.trim() || null });
    setNoteEditing(null);
  };

  return (
    <Table>
      <TableHeadSearchable
        headers={HEADERS}
        colSpan={HEADERS.length}
        tab={sortTab}
        reverse={sortReverse}
        tabOnChange={handleSort}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by counterparty, token, note or tx hash…"
        hideMyWallet
        inMyWallet={false}
        onInMyWalletChange={() => {}}
        filterOptionsTitle="Classification"
        filterOptions={CLASSIFICATION_OPTIONS.map(o => ({ label: o.label, value: o.value }))}
        activeFilters={classFilters}
        onFiltersChange={setClassFilters}
      />
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
            const txUrl = EXPLORER_BASE[t.chainId] ? `${EXPLORER_BASE[t.chainId]}/tx/${t.txHash}` : null;
            const addr = counterpartyAddress(t);
            const existingLabel = labels[addr] ?? null;
            const isEditingLabel = labelEditing?.addr === addr;

            return (
              <TableRow key={t.id} headers={HEADERS} colSpan={HEADERS.length}>
                {/* Date (+ address badge stacked below) */}
                <div className="flex flex-col items-start gap-1">
                  {txUrl ? (
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
                  <span
                    className={`text-xs border rounded-lg px-1.5 py-0.5 truncate max-w-full ${ADDRESS_COLOR_CLASSES[colorFor(t.addressId)].bg} ${ADDRESS_COLOR_CLASSES[colorFor(t.addressId)].text} ${ADDRESS_COLOR_CLASSES[colorFor(t.addressId)].border}`}
                  >
                    {addressLabel(t.addressId)}
                  </span>
                </div>

                {/* Counterparty */}
                <div onClick={e => e.stopPropagation()}>
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
                </div>

                {/* Amount */}
                <div className="text-right">
                  <span className={`text-sm font-semibold tabular-nums ${isIn ? 'text-success' : 'text-error'}`}>
                    {isIn ? '+' : '−'}
                    {fmtAmount(parseFloat(t.amountFormatted ?? '0'))}
                    <span className="font-normal text-text-muted ml-1 text-xs">{t.tokenSymbol}</span>
                  </span>
                </div>

                {/* Value (CHF) — sign and colour driven by direction, input stays positive */}
                <div onClick={e => e.stopPropagation()}>
                  <EditableCell
                    value={t.chfValue ? `${isIn ? '+' : '−'}CHF ${fmtNum(parseFloat(t.chfValue))}` : null}
                    isEditing={chfEditing?.id === t.id}
                    editValue={chfEditing?.id === t.id ? chfEditing.value : ''}
                    onEdit={() => setChfEditing({ id: t.id, value: t.chfValue ?? '' })}
                    onSave={handleSaveChf}
                    onClear={() => handleClearChf(t.id)}
                    onCancel={() => setChfEditing(null)}
                    onChange={v => setChfEditing({ id: t.id, value: v })}
                    placeholder="0.00"
                    emptyText="Set value"
                    valueClassName={`font-semibold ${isIn ? 'text-success' : 'text-error'}`}
                    isEstimate={t.chfValueIsEstimate}
                    estimateTooltip="Estimated from daily close rate — click to confirm or clear to re-estimate"
                  />
                </div>

                {/* Note */}
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

                {/* Classification */}
                <div className="flex justify-end min-w-0" onClick={e => e.stopPropagation()}>
                  <select
                    value={t.classification}
                    onChange={e => onUpdate(t.id, { classification: e.target.value })}
                    className={`print:hidden text-xs rounded-lg px-2 py-1 border-transparent outline-none cursor-pointer max-w-full ${cls.bg} ${cls.color}`}
                  >
                    {CLASSIFICATION_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <span className={`hidden print:inline-block text-xs font-medium rounded-lg px-2 py-1 ${cls.bg} ${cls.color}`}>
                    {CLASSIFICATION_OPTIONS.find(o => o.value === t.classification)?.label ?? t.classification}
                  </span>
                </div>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
