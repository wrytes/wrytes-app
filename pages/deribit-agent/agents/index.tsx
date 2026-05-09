import Head from 'next/head';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { AgentError } from '@/components/features/DeribitAgent/AgentError';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRobot,
  faPlus,
  faPlay,
  faPause,
  faStop,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { Section, PageHeader } from '@/components/ui/Layout';
import Card from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import TextInput from '@/components/ui/Input/TextInput';
import { CellEditable } from '@/components/ui/CellEditable';
import { SelectInput } from '@/components/ui/Input/SelectInput';
import TableHeadSearchable from '@/components/ui/Table/TableHeadSearchable';
import TableBody from '@/components/ui/Table/TableBody';
import TableRow from '@/components/ui/Table/TableRow';
import TableRowEmpty from '@/components/ui/Table/TableRowEmpty';
import {
  useDeribitFetch,
  agentFetch,
  type AgentRun,
  type RunType,
  type CreateRunBody,
  type DeribitAccount,
  type TrainedModel,
} from '@/lib/deribit-agent/client';
import { RUN_STATUS_BADGE, fmtDate, fmt } from '@/lib/deribit-agent/ui';

const RUN_TYPE_BADGE: Record<RunType, { color: string; bg: string }> = {
  BACKTEST: { color: '#6b7280', bg: '#f3f4f6' },
  PAPER: { color: '#2563eb', bg: '#eff6ff' },
  LIVE: { color: '#dc2626', bg: '#fef2f2' },
};

const RUN_STATUSES = ['ACTIVE', 'PAUSED', 'STOPPED', 'COMPLETED', 'ERROR'];
const RUN_TYPES = [
  { value: 'BACKTEST', label: 'Backtest' },
  { value: 'PAPER', label: 'Paper' },
  { value: 'LIVE', label: 'Live' },
];
const TABLE_HEADERS = ['Name', 'Type', 'Start Capital', 'End Capital', 'Status', 'Created'];

const CURRENCY_OPTIONS = [
  { value: 'BTC', label: 'BTC' },
  { value: 'ETH', label: 'ETH' },
];

const BLANK_RUN: CreateRunBody = {
  name: '',
  currency: 'BTC',
  runType: 'PAPER',
  initialCapitalBtc: 1,
  sessionId: '',
};

export default function DeribitRunsPage() {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateRunBody>(BLANK_RUN);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [actioning, setActioning] = useState<Record<string, boolean>>({});

  // Table controls
  const [search, setSearch] = useState('');
  const [activeStatuses, setActiveStatuses] = useState<string[]>([]);
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [sortCol, setSortCol] = useState('Created');
  const [sortReverse, setSortReverse] = useState(true);

  const { data: runs, loading, error, refetch } = useDeribitFetch<AgentRun[]>('/agent/runs');
  const { data: accounts } = useDeribitFetch<DeribitAccount[]>('/deribit-account');
  const { data: models } = useDeribitFetch<TrainedModel[]>('/training/models');

  const modelOptions = [
    { value: '', label: 'No model' },
    ...(models ?? []).map(m => {
      const name = /_(ppo|dqn|a2c)$/i.test(m.name) ? (m.session?.name ?? m.name) : m.name;
      const algo = m.session?.algorithm ?? '';
      const ccy = m.session?.currency ?? '';
      return {
        value: m.sessionId,
        label: `${name}${algo ? ` — ${algo}` : ''}${ccy ? ` (${ccy})` : ''}`,
      };
    }),
  ];

  const accountOptions = [
    { value: '', label: 'Select Deribit account…' },
    ...(accounts ?? []).map(a => ({
      value: a.id,
      label: `${a.label}${a.isDefault ? ' (default)' : ''} — ${a.clientId}`,
    })),
  ];

  const visibleRuns = useMemo(() => {
    let data = runs ?? [];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        r =>
          r.name.toLowerCase().includes(q) ||
          r.notes?.toLowerCase().includes(q) ||
          r.currency.toLowerCase().includes(q)
      );
    }
    if (activeStatuses.length) data = data.filter(r => activeStatuses.includes(r.status));
    if (activeTypes.length) data = data.filter(r => activeTypes.includes(r.runType ?? 'PAPER'));
    return [...data].sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case 'Name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'Type':
          cmp = (a.runType ?? 'PAPER').localeCompare(b.runType ?? 'PAPER');
          break;
        case 'Start Capital':
          cmp = Number(a.initialCapitalBtc) - Number(b.initialCapitalBtc);
          break;
        case 'End Capital': {
          const ca = Number(a.initialCapitalBtc) + Number(a.realizedPnlBtc ?? 0);
          const cb = Number(b.initialCapitalBtc) + Number(b.realizedPnlBtc ?? 0);
          cmp = ca - cb;
          break;
        }
        case 'Status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'Created':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortReverse ? -cmp : cmp;
    });
  }, [runs, search, activeStatuses, activeTypes, sortCol, sortReverse]);

  const handleSort = (col: string) => {
    if (sortCol === col) setSortReverse(r => !r);
    else {
      setSortCol(col);
      setSortReverse(false);
    }
  };

  const patchForm = (k: keyof CreateRunBody, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const createRun = async () => {
    if (!form.name || !form.initialCapitalBtc) {
      toast.error('Name and initial capital are required.');
      return;
    }
    if (form.runType === 'LIVE' && !form.deribitAccountId) {
      toast.error('Select a Deribit account for live runs.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await agentFetch<AgentRun>('/agent/runs', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          sessionId: form.sessionId || undefined,
          deribitAccountId: form.deribitAccountId || undefined,
        }),
      });
      toast.success('Agent created.');
      setForm(BLANK_RUN);
      setShowCreate(false);
      refetch();
      router.push(`/deribit-agent/agents/${created.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create agent.');
    } finally {
      setSubmitting(false);
    }
  };

  const runAction = async (id: string, action: 'stop' | 'pause' | 'resume') => {
    setActioning(a => ({ ...a, [id]: true }));
    try {
      await agentFetch(`/agent/runs/${id}/${action}`, { method: 'POST' });
      toast.success(`Agent ${action === 'stop' ? 'stopped' : action === 'pause' ? 'paused' : 'resumed'}.`);
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `Failed to ${action} run.`);
    } finally {
      setActioning(a => ({ ...a, [id]: false }));
    }
  };

  const deleteAgent = async (id: string) => {
    if (!confirm('Delete this agent and all its actions? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await agentFetch(`/agent/runs/${id}`, { method: 'DELETE' });
      toast.success('Agent deleted.');
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete agent.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <Head>
        <title>Deribit Agent — Agents</title>
      </Head>

      <Section>
        <PageHeader
          title="Agents"
          description="Manage and execute backtest, paper, and live trading runs."
          icon={faRobot}
          actions={
            <button
              type="button"
              onClick={() => setShowCreate(v => !v)}
              className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
              New Agent
            </button>
          }
        />

        {/* Create form */}
        {showCreate && (
          <Card className="mt-4">
            <p className="text-sm font-semibold text-text-primary mb-4">New Agent</p>

            {/* Run type */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(['BACKTEST', 'PAPER', 'LIVE'] as RunType[]).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => patchForm('runType', type)}
                  className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                    form.runType === type
                      ? 'border-brand bg-brand/5 text-brand'
                      : 'border-input-border text-text-secondary hover:border-brand/50'
                  }`}
                >
                  <div className="font-semibold">{type}</div>
                  <div className="text-xs font-normal text-text-muted mt-0.5">
                    {type === 'BACKTEST' && 'Historical replay'}
                    {type === 'PAPER' && 'Live data, no orders'}
                    {type === 'LIVE' && 'Real Deribit orders'}
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                label="Name"
                placeholder="btc-ppo-run-1"
                value={form.name}
                onChange={v => patchForm('name', v)}
              />
              <TextInput
                label="Initial Capital (BTC)"
                placeholder="1.0"
                value={String(form.initialCapitalBtc)}
                onChange={v => patchForm('initialCapitalBtc', parseFloat(v) || 0)}
              />
              <SelectInput
                label="Currency"
                options={CURRENCY_OPTIONS}
                value={form.currency}
                onChange={v => patchForm('currency', v)}
              />
              <SelectInput
                label="Model (optional)"
                options={modelOptions}
                value={form.sessionId ?? ''}
                onChange={v => patchForm('sessionId', v)}
              />
              {form.runType === 'LIVE' && (
                <div className="md:col-span-2">
                  <SelectInput
                    label="Deribit Account"
                    options={accountOptions}
                    value={form.deribitAccountId ?? ''}
                    onChange={v => patchForm('deribitAccountId', v)}
                  />
                  {!accounts?.length && (
                    <p className="text-xs text-error mt-1.5">
                      No Deribit accounts configured. Add one in Settings first.
                    </p>
                  )}
                </div>
              )}
            </div>

            {form.runType === 'LIVE' && (
              <div className="mt-3 bg-error/5 border border-error/20 rounded-lg px-4 py-2.5">
                <p className="text-xs text-error font-medium">
                  Live mode places real orders on your Deribit account. Review the model before running.
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={createRun}
                disabled={submitting}
                className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Creating…' : 'Create Agent'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          </Card>
        )}

        {/* Runs table */}
        <div className="mt-6">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 bg-card rounded-lg animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <AgentError message={error} onRetry={refetch} />
          ) : (
            <div className="rounded-lg overflow-hidden border border-table-alt">
              <TableHeadSearchable
                searchPlaceholder="Search by name, currency…"
                searchValue={search}
                onSearchChange={setSearch}
                hideMyWallet
                inMyWallet={false}
                onInMyWalletChange={() => {}}
                filterOptionsTitle="Type"
                filterOptions={RUN_TYPES}
                activeFilters={activeTypes}
                onFiltersChange={setActiveTypes}
                customCategoriesTitle="Status"
                customCategories={RUN_STATUSES}
                activeCustomCategories={activeStatuses}
                onCustomCategoriesChange={setActiveStatuses}
                headers={TABLE_HEADERS}
                colSpan={TABLE_HEADERS.length}
                tab={sortCol}
                reverse={sortReverse}
                tabOnChange={handleSort}
                actionCol
              />
              <TableBody>
                {visibleRuns.length === 0 ? (
                  <TableRowEmpty>
                    {runs?.length ? 'No agents match your filters.' : 'No agents yet.'}
                  </TableRowEmpty>
                ) : (
                  (visibleRuns.map(run => {
                    const isAct = actioning[run.id];
                    const isDel = deleting === run.id;
                    const rt = run.runType ?? 'PAPER';
                    const currCapital =
                      Number(run.initialCapitalBtc) + Number(run.realizedPnlBtc ?? 0);
                    const capitalDelta = currCapital - Number(run.initialCapitalBtc);

                    return (
                      <TableRow
                        key={run.id}
                        colSpan={TABLE_HEADERS.length}
                        headers={TABLE_HEADERS}
                        tab={sortCol}
                        onClick={() => router.push(`/deribit-agent/agents/${run.id}`)}
                        actionCol={
                          <div className="flex items-center justify-end gap-1">
                            {run.status === 'ACTIVE' && (
                              <button
                                type="button"
                                disabled={isAct}
                                onClick={e => { e.stopPropagation(); runAction(run.id, 'pause'); }}
                                title="Pause"
                                className="p-1.5 rounded text-yellow-400 hover:bg-yellow-400/20 transition-colors disabled:opacity-50"
                              >
                                <FontAwesomeIcon icon={faPause} className="w-3 h-3" />
                              </button>
                            )}
                            {run.status === 'PAUSED' && (
                              <button
                                type="button"
                                disabled={isAct}
                                onClick={e => { e.stopPropagation(); runAction(run.id, 'resume'); }}
                                title="Resume"
                                className="p-1.5 rounded text-success hover:bg-success/20 transition-colors disabled:opacity-50"
                              >
                                <FontAwesomeIcon icon={faPlay} className="w-3 h-3" />
                              </button>
                            )}
                            {(run.status === 'ACTIVE' || run.status === 'PAUSED') && (
                              <button
                                type="button"
                                disabled={isAct}
                                onClick={e => { e.stopPropagation(); runAction(run.id, 'stop'); }}
                                title="Stop"
                                className="p-1.5 rounded text-error hover:bg-error/20 transition-colors disabled:opacity-50"
                              >
                                <FontAwesomeIcon icon={faStop} className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={isDel}
                              onClick={e => { e.stopPropagation(); deleteAgent(run.id); }}
                              title="Delete"
                              className="p-1.5 rounded text-error hover:bg-error/20 transition-colors disabled:opacity-50"
                            >
                              <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                            </button>
                          </div>
                        }
                      >
                        {/* Name */}
                        <div className="text-left" onClick={e => e.stopPropagation()}>
                          <CellEditable
                            value={run.name}
                            onSave={async v => {
                              await agentFetch(`/agent/runs/${run.id}`, {
                                method: 'PATCH',
                                body: JSON.stringify({ name: v }),
                              });
                              refetch();
                            }}
                          />
                          {run.notes && (
                            <div className="text-text-muted text-xs mt-0.5">{run.notes}</div>
                          )}
                        </div>
                        {/* Type */}
                        <span>
                          <Badge
                            text={rt}
                            variant="custom"
                            customColor={RUN_TYPE_BADGE[rt].color}
                            customBgColor={RUN_TYPE_BADGE[rt].bg}
                          />
                        </span>
                        {/* Start Capital */}
                        <span className="font-mono text-text-secondary">
                          {fmt(run.initialCapitalBtc, 4)} {run.currency}
                        </span>
                        {/* End Capital */}
                        <span
                          className={`font-mono ${capitalDelta > 0 ? 'text-success' : capitalDelta < 0 ? 'text-error' : 'text-text-secondary'}`}
                        >
                          {fmt(currCapital, 4)} {run.currency}
                        </span>
                        {/* Status */}
                        <span>
                          <Badge
                            text={run.status}
                            variant="custom"
                            customColor={RUN_STATUS_BADGE[run.status].color}
                            customBgColor={RUN_STATUS_BADGE[run.status].bg}
                          />
                        </span>
                        {/* Created */}
                        <span className="text-text-muted">{fmtDate(run.createdAt)}</span>
                      </TableRow>
                    );
                  }) as any)
                )}
              </TableBody>
            </div>
          )}
        </div>
      </Section>
    </>
  );
}
