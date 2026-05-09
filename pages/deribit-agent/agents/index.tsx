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
  faChevronDown,
  faChevronUp,
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
  type ExecuteRunBody,
  type DeribitAccount,
  type TrainingSession,
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
  notes: '',
};

const BLANK_EXEC: {
  dataFrom: string;
  dataTo: string;
  envOverrides: ExecuteRunBody['envOverrides'];
} = {
  dataFrom: '',
  dataTo: '',
  envOverrides: {},
};

function numOrUndef(s: string): number | undefined {
  const n = parseFloat(s);
  return isNaN(n) ? undefined : n;
}

export default function DeribitRunsPage() {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateRunBody>(BLANK_RUN);
  const [submitting, setSubmitting] = useState(false);

  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [execForms, setExecForms] = useState<Record<string, typeof BLANK_EXEC>>({});
  const [executing, setExecuting] = useState<Record<string, boolean>>({});
  const [actioning, setActioning] = useState<Record<string, boolean>>({});
  const [sessionCache, setSessionCache] = useState<Record<string, TrainingSession>>({});
  const [prefilling, setPrefilling] = useState<Set<string>>(new Set());

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
    { value: '', label: 'No model — paper / live without inference' },
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
        case 'Curr. Capital': {
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
    if (!form.name || !form.currency || !form.initialCapitalBtc) {
      toast.error('Name, currency and capital are required.');
      return;
    }
    if (form.runType === 'LIVE' && !form.deribitAccountId) {
      toast.error('Select a Deribit account for live runs.');
      return;
    }
    setSubmitting(true);
    try {
      await agentFetch('/agent/runs', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          sessionId: form.sessionId || undefined,
          notes: form.notes || undefined,
          deribitAccountId: form.deribitAccountId || undefined,
        }),
      });
      toast.success('Agent deployed.');
      setForm(BLANK_RUN);
      setShowCreate(false);
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create run.');
    } finally {
      setSubmitting(false);
    }
  };

  const runAction = async (id: string, action: 'stop' | 'pause' | 'resume') => {
    setActioning(a => ({ ...a, [id]: true }));
    try {
      await agentFetch(`/agent/runs/${id}/${action}`, { method: 'POST' });
      toast.success(
        `Agent ${action === 'stop' ? 'stopped' : action === 'pause' ? 'paused' : 'resumed'}.`
      );
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : `Failed to ${action} run.`);
    } finally {
      setActioning(a => ({ ...a, [id]: false }));
    }
  };

  const executeRun = async (run: AgentRun) => {
    const ef = execForms[run.id] ?? BLANK_EXEC;
    setExecuting(e => ({ ...e, [run.id]: true }));
    try {
      const body: ExecuteRunBody = {};
      if (ef.dataFrom) body.dataFrom = ef.dataFrom;
      if (ef.dataTo) body.dataTo = ef.dataTo;
      const cleanOv = Object.fromEntries(
        Object.entries(ef.envOverrides ?? {}).filter(([, v]) => v !== undefined)
      );
      if (Object.keys(cleanOv).length > 0)
        body.envOverrides = cleanOv as ExecuteRunBody['envOverrides'];
      await agentFetch(`/agent/runs/${run.id}/execute`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      toast.success('Agent execution queued.');
      refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Execute failed.');
    } finally {
      setExecuting(e => ({ ...e, [run.id]: false }));
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

  const ENV_OVERRIDE_KEYS: (keyof NonNullable<ExecuteRunBody['envOverrides']>)[] = [
    'expiry_days',
    'position_size_pct',
    'max_position_btc',
    'delta_threshold',
    'delta_penalty_coef',
    'max_margin_ratio',
    'risk_free_rate',
    'loss_multiplier',
    'loss_threshold',
    'capital_eff_bonus',
  ];

  const prefillExecForm = (runId: string, session: TrainingSession) => {
    const env = (session.hyperparams?.env ?? {}) as Record<string, unknown>;
    const overrides: Record<string, number> = {};
    for (const k of ENV_OVERRIDE_KEYS) {
      const v = env[k];
      if (typeof v === 'number') overrides[k] = v;
    }
    setExecForms(f => ({
      ...f,
      [runId]: {
        dataFrom: session.dataFrom,
        dataTo: session.dataTo,
        envOverrides: overrides as ExecuteRunBody['envOverrides'],
      },
    }));
  };

  const handleExpand = async (run: AgentRun) => {
    const next = expandedRun === run.id ? null : run.id;
    setExpandedRun(next);

    if (!next || !run.sessionId || execForms[run.id] !== undefined) return;

    const cached = sessionCache[run.sessionId];
    if (cached) {
      prefillExecForm(run.id, cached);
      return;
    }

    if (prefilling.has(run.id)) return;
    setPrefilling(p => new Set([...p, run.id]));
    try {
      const session = await agentFetch<TrainingSession>(`/training/sessions/${run.sessionId}`);
      setSessionCache(c => ({ ...c, [run.sessionId!]: session }));
      prefillExecForm(run.id, session);
    } catch {
      // user can fill manually
    } finally {
      setPrefilling(p => {
        const n = new Set(p);
        n.delete(run.id);
        return n;
      });
    }
  };

  const patchExec = (runId: string, key: string, val: string) => {
    setExecForms(f => {
      const base = f[runId] ?? { ...BLANK_EXEC, envOverrides: {} };
      if (key === 'dataFrom' || key === 'dataTo') {
        return { ...f, [runId]: { ...base, [key]: val } };
      }
      return {
        ...f,
        [runId]: {
          ...base,
          envOverrides: { ...(base.envOverrides ?? {}), [key]: numOrUndef(val) },
        },
      };
    });
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
            <p className="text-sm font-semibold text-text-primary mb-4">Deploy New Agent</p>

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
              <SelectInput
                label="Currency"
                options={CURRENCY_OPTIONS}
                value={form.currency}
                onChange={v => patchForm('currency', v)}
              />
              <TextInput
                label="Initial Capital (BTC)"
                placeholder="0.1"
                value={String(form.initialCapitalBtc)}
                onChange={v => patchForm('initialCapitalBtc', parseFloat(v) || 0)}
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

              <TextInput
                label="Notes (optional)"
                placeholder="Any notes..."
                value={form.notes ?? ''}
                onChange={v => patchForm('notes', v)}
              />
            </div>

            {form.runType === 'LIVE' && (
              <div className="mt-3 bg-error/5 border border-error/20 rounded-lg px-4 py-2.5">
                <p className="text-xs text-error font-medium">
                  Live mode will place real orders on your Deribit account. Ensure you have reviewed
                  the model before running.
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
                {submitting ? 'Deploying…' : 'Deploy'}
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
                searchPlaceholder="Search by name, notes, currency…"
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
                    const isExpanded = expandedRun === run.id;
                    const ef = execForms[run.id] ?? BLANK_EXEC;
                    const ov = ef.envOverrides ?? {};
                    const isExec = executing[run.id];
                    const isAct = actioning[run.id];
                    const isDel = deleting === run.id;
                    const rt = run.runType ?? 'PAPER';
                    const currCapital =
                      Number(run.initialCapitalBtc) + Number(run.realizedPnlBtc ?? 0);
                    const capitalDelta = currCapital - Number(run.initialCapitalBtc);

                    return (
                      <div key={run.id}>
                        <TableRow
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
                                  onClick={e => {
                                    e.stopPropagation();
                                    runAction(run.id, 'pause');
                                  }}
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
                                  onClick={e => {
                                    e.stopPropagation();
                                    runAction(run.id, 'resume');
                                  }}
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
                                  onClick={e => {
                                    e.stopPropagation();
                                    runAction(run.id, 'stop');
                                  }}
                                  title="Stop"
                                  className="p-1.5 rounded text-error hover:bg-error/20 transition-colors disabled:opacity-50"
                                >
                                  <FontAwesomeIcon icon={faStop} className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleExpand(run);
                                }}
                                title="Execute"
                                className="p-1.5 rounded text-text-secondary hover:text-brand transition-colors"
                              >
                                <FontAwesomeIcon
                                  icon={isExpanded ? faChevronUp : faChevronDown}
                                  className="w-3 h-3"
                                />
                              </button>
                              <button
                                type="button"
                                disabled={isDel}
                                onClick={e => {
                                  e.stopPropagation();
                                  deleteAgent(run.id);
                                }}
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
                          {/* Curr. Capital */}
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

                        {/* Execute panel */}
                        {isExpanded && (
                          <div className="border-t border-table-alt px-6 py-4 bg-surface/20">
                            <p className="text-sm font-semibold text-text-primary mb-4">
                              Execute Agent
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <TextInput
                                label="Data From (ISO, optional)"
                                placeholder="2024-01-01T00:00:00Z"
                                value={ef.dataFrom}
                                onChange={v => patchExec(run.id, 'dataFrom', v)}
                              />
                              <TextInput
                                label="Data To (ISO, optional)"
                                placeholder="2024-12-31T23:59:59Z"
                                value={ef.dataTo}
                                onChange={v => patchExec(run.id, 'dataTo', v)}
                              />
                            </div>
                            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mt-4 mb-3">
                              Env Overrides (optional)
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {(
                                [
                                  ['expiry_days', 'Expiry Days'],
                                  ['position_size_pct', 'Position Size %'],
                                  ['max_position_btc', 'Max Position BTC'],
                                  ['delta_threshold', 'Delta Threshold'],
                                  ['delta_penalty_coef', 'Delta Penalty Coef'],
                                  ['max_margin_ratio', 'Max Margin Ratio'],
                                ] as const
                              ).map(([key, label]) => (
                                <TextInput
                                  key={key}
                                  label={label}
                                  placeholder="—"
                                  value={ov[key] !== undefined ? String(ov[key]) : ''}
                                  onChange={v => patchExec(run.id, key, v)}
                                />
                              ))}
                            </div>
                            <button
                              type="button"
                              disabled={isExec}
                              onClick={() => executeRun(run)}
                              className="mt-4 inline-flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 disabled:opacity-50 transition-colors"
                            >
                              <FontAwesomeIcon icon={faPlay} className="w-3 h-3" />
                              {isExec ? 'Queuing…' : 'Execute'}
                            </button>
                          </div>
                        )}
                      </div>
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
