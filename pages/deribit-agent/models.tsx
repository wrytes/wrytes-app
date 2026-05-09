import Head from 'next/head';
import { useState, useMemo } from 'react';
import { AgentError } from '@/components/features/DeribitAgent/AgentError';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBrain, faPlus, faBan, faTrash, faPlay } from '@fortawesome/free-solid-svg-icons';
import { Section, PageHeader } from '@/components/ui/Layout';
import Card from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import TextInput from '@/components/ui/Input/TextInput';
import { SelectInput } from '@/components/ui/Input/SelectInput';
import SliderInput from '@/components/ui/Input/SliderInput';
import TableHeadSearchable from '@/components/ui/Table/TableHeadSearchable';
import TableBody from '@/components/ui/Table/TableBody';
import TableRow from '@/components/ui/Table/TableRow';
import TableRowEmpty from '@/components/ui/Table/TableRowEmpty';
import { CellEditable } from '@/components/ui/CellEditable';
import {
  useDeribitFetch,
  agentFetch,
  type TrainingSession,
  type TrainedModel,
  type CreateSessionBody,
  type RiskProfile,
} from '@/lib/deribit-agent/client';
import { SESSION_STATUS_BADGE, fmt, fmtDate } from '@/lib/deribit-agent/ui';

const CURRENCY_OPTIONS = [
  { value: 'BTC', label: 'BTC' },
  { value: 'ETH', label: 'ETH' },
];

const ALGORITHM_OPTIONS = [
  { value: 'PPO', label: 'PPO' },
  { value: 'DQN', label: 'DQN' },
  { value: 'A2C', label: 'A2C' },
];

const STRATEGY_OPTIONS = [
  { value: 'short_call', label: 'Short Call', desc: 'Sell calls at any delta (Δ20–Δ80)' },
  { value: 'short_put', label: 'Short Put', desc: 'Sell puts at any delta (Δ10–Δ50)' },
  {
    value: 'delta_neutral',
    label: 'Delta Neutral',
    desc: 'Balanced call + put positioning, including one-action strangles',
  },
];

const SESSION_STATUSES = ['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'];
const SESSION_HEADERS = ['Name', 'Currency', 'Algorithm', 'Status', 'Created'];
const MODEL_HEADERS = [
  'Name',
  'Obs Space',
  'Policy',
  'Algorithm',
  'Trained On',
  'Mean Reward',
  'Size',
  'Created',
];
const MODEL_STORAGE_TYPES = ['local', 's3'];

const BLANK_SESSION: CreateSessionBody & {
  allowedStrategies: string[];
  riskProfile: Required<RiskProfile>;
  totalTimesteps: number;
  learningRate: number;
} = {
  name: '',
  description: '',
  currency: 'BTC',
  dataFrom: '2022-01-01',
  dataTo: new Date().toISOString().slice(0, 10),
  resolution: '1D',
  algorithm: 'PPO',
  allowedStrategies: ['short_call', 'short_put', 'delta_neutral'],
  riskProfile: { maxDrawdown: 0.2, aggressionLevel: 0.5 },
  totalTimesteps: 100_000,
  learningRate: 0.005,
};

function aggressionLabel(level: number): string {
  if (level <= 0.2) return 'Very Passive';
  if (level <= 0.4) return 'Passive';
  if (level <= 0.6) return 'Balanced';
  if (level <= 0.8) return 'Aggressive';
  return 'Very Aggressive';
}

// If model.name is still the trainer's auto-generated filename (e.g. cmowte83_ppo),
// show the session name as the human-readable fallback.
function resolveModelName(m: TrainedModel): string {
  return /_(ppo|dqn|a2c)$/i.test(m.name) ? (m.session?.name ?? m.name) : m.name;
}

function fmtSteps(n?: number | null): string {
  if (!n) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${Math.round(n / 1_000)}k`;
  return String(n);
}

function fmtSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function ModelsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(BLANK_SESSION);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [pushingBacktest, setPushingBacktest] = useState<string | null>(null);

  // Session table controls
  const [sessionSearch, setSessionSearch] = useState('');
  const [activeStatuses, setActiveStatuses] = useState<string[]>([]);
  const [sessionSortCol, setSessionSortCol] = useState('Created');
  const [sessionSortReverse, setSessionSortReverse] = useState(true);

  // Model table controls
  const [modelSearch, setModelSearch] = useState('');
  const [activeStorageTypes, setActiveStorageTypes] = useState<string[]>([]);
  const [modelSortCol, setModelSortCol] = useState('Created');
  const [modelSortReverse, setModelSortReverse] = useState(true);

  const sessions = useDeribitFetch<TrainingSession[]>('/training/sessions');
  const models = useDeribitFetch<TrainedModel[]>('/training/models');

  // ── Session filtering / sorting ─────────────────────────────────────────────

  const visibleSessions = useMemo(() => {
    let data = sessions.data ?? [];
    if (sessionSearch) {
      const q = sessionSearch.toLowerCase();
      data = data.filter(
        s =>
          s.name.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.algorithm.toLowerCase().includes(q)
      );
    }
    if (activeStatuses.length) {
      data = data.filter(s => activeStatuses.includes(s.status));
    }
    return [...data].sort((a, b) => {
      let cmp = 0;
      switch (sessionSortCol) {
        case 'Name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'Model Name':
          cmp = (a.model?.name ?? '').localeCompare(b.model?.name ?? '');
          break;
        case 'Currency':
          cmp = a.currency.localeCompare(b.currency);
          break;
        case 'Algorithm':
          cmp = a.algorithm.localeCompare(b.algorithm);
          break;
        case 'Status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'Created':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sessionSortReverse ? -cmp : cmp;
    });
  }, [sessions.data, sessionSearch, activeStatuses, sessionSortCol, sessionSortReverse]);

  const handleSessionSort = (col: string) => {
    if (sessionSortCol === col) setSessionSortReverse(r => !r);
    else {
      setSessionSortCol(col);
      setSessionSortReverse(false);
    }
  };

  // ── Model filtering / sorting ────────────────────────────────────────────────

  const visibleModels = useMemo(() => {
    let data = models.data ?? [];
    if (modelSearch) {
      const q = modelSearch.toLowerCase();
      data = data.filter(
        m =>
          m.name.toLowerCase().includes(q) ||
          m.session?.name.toLowerCase().includes(q) ||
          m.session?.algorithm.toLowerCase().includes(q)
      );
    }
    if (activeStorageTypes.length) {
      data = data.filter(m => activeStorageTypes.includes(m.storageType));
    }
    return [...data].sort((a, b) => {
      let cmp = 0;
      switch (modelSortCol) {
        case 'Name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'Obs Space':
          cmp = (a.metadata?.obs_dims ?? 0) - (b.metadata?.obs_dims ?? 0);
          break;
        case 'Policy':
          cmp = (a.metadata?.policy ?? '').localeCompare(b.metadata?.policy ?? '');
          break;
        case 'Algorithm':
          cmp = (a.session?.algorithm ?? '').localeCompare(b.session?.algorithm ?? '');
          break;
        case 'Trained On':
          cmp = (a.session?.totalTimesteps ?? 0) - (b.session?.totalTimesteps ?? 0);
          break;
        case 'Mean Reward':
          cmp = (a.meanReward ?? -Infinity) - (b.meanReward ?? -Infinity);
          break;
        case 'Size':
          cmp = (a.sizeBytes ?? 0) - (b.sizeBytes ?? 0);
          break;
        case 'Created':
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return modelSortReverse ? -cmp : cmp;
    });
  }, [models.data, modelSearch, activeStorageTypes, modelSortCol, modelSortReverse]);

  const handleModelSort = (col: string) => {
    if (modelSortCol === col) setModelSortReverse(r => !r);
    else {
      setModelSortCol(col);
      setModelSortReverse(false);
    }
  };

  // ── Actions ──────────────────────────────────────────────────────────────────

  const patchForm = (k: keyof typeof form, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const toggleStrategy = (strategy: string) => {
    setForm(f => ({
      ...f,
      allowedStrategies: f.allowedStrategies.includes(strategy)
        ? f.allowedStrategies.filter(s => s !== strategy)
        : [...f.allowedStrategies, strategy],
    }));
  };

  const createSession = async () => {
    if (!form.name || !form.currency || !form.dataFrom || !form.dataTo) {
      toast.error('Name, currency, data from and data to are required.');
      return;
    }
    if (!form.allowedStrategies.length) {
      toast.error('Select at least one strategy to allow during training.');
      return;
    }
    setSubmitting(true);
    try {
      await agentFetch('/training/sessions', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          currency: form.currency,
          dataFrom: new Date(form.dataFrom).toISOString(),
          dataTo: new Date(form.dataTo + 'T23:59:59').toISOString(),
          resolution: form.resolution,
          algorithm: form.algorithm,
          allowedStrategies: form.allowedStrategies,
          riskProfile: form.riskProfile,
          hyperparams: {
            training: {
              total_timesteps: form.totalTimesteps,
              learning_rate:   form.learningRate,
            },
          },
        } satisfies CreateSessionBody),
      });
      toast.success('Training session queued.');
      setForm(BLANK_SESSION);
      setShowCreate(false);
      sessions.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create session.');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelSession = async (id: string) => {
    setCancelling(id);
    try {
      await agentFetch(`/training/sessions/${id}/cancel`, { method: 'POST' });
      toast.success('Session cancelled.');
      sessions.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to cancel session.');
    } finally {
      setCancelling(null);
    }
  };

  const deleteSession = async (id: string) => {
    if (
      !confirm(
        'Hard-delete this session? This also removes its model and all associated agent runs.'
      )
    )
      return;
    setDeleting(id);
    try {
      await agentFetch(`/training/sessions/${id}`, { method: 'DELETE' });
      toast.success('Session deleted.');
      sessions.refetch();
      models.refetch();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete session.');
    } finally {
      setDeleting(null);
    }
  };

  const renameSession = async (id: string, name: string) => {
    await agentFetch(`/training/sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
    sessions.refetch();
  };

  const renameModel = async (id: string, name: string) => {
    await agentFetch(`/training/models/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
    models.refetch();
    sessions.refetch();
  };

  const pushToBacktest = async (m: TrainedModel) => {
    setPushingBacktest(m.id);
    try {
      await agentFetch('/agent/runs', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: m.sessionId,
          name: `${m.name} — backtest`,
          currency: m.session?.currency ?? 'BTC',
          runType: 'BACKTEST',
          initialCapitalBtc: 1,
        }),
      });
      toast.success('Backtest queued — check the Agents page.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to queue backtest.');
    } finally {
      setPushingBacktest(null);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <Head>
        <title>Deribit Agent — Models</title>
      </Head>

      <Section>
        <PageHeader
          title="Models"
          description="Train and manage ML models for the options agent."
          icon={faBrain}
          actions={
            <button
              type="button"
              onClick={() => setShowCreate(v => !v)}
              className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
              New Model
            </button>
          }
        />

        {/* ── Create form ────────────────────────────────────────────────────── */}
        {showCreate && (
          <Card className="mt-4">
            <p className="text-sm font-semibold text-text-primary mb-4">Create Training Model</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                label="Name"
                placeholder="btc-ppo-v1"
                value={form.name}
                onChange={v => patchForm('name', v)}
              />
              <TextInput
                label="Description (optional)"
                placeholder="Short description"
                value={form.description ?? ''}
                onChange={v => patchForm('description', v)}
              />
              <SelectInput
                label="Currency"
                options={CURRENCY_OPTIONS}
                value={form.currency}
                onChange={v => patchForm('currency', v)}
              />
              <SelectInput
                label="Algorithm"
                options={ALGORITHM_OPTIONS}
                value={form.algorithm ?? 'PPO'}
                onChange={v => patchForm('algorithm', v)}
              />
              <TextInput
                label="Data From"
                type="date"
                value={form.dataFrom}
                onChange={v => patchForm('dataFrom', v)}
              />
              <TextInput
                label="Data To"
                type="date"
                value={form.dataTo}
                onChange={v => patchForm('dataTo', v)}
              />
              <TextInput
                label="Total Timesteps"
                type="number"
                value={String(form.totalTimesteps)}
                onChange={v => patchForm('totalTimesteps', Math.max(1, parseInt(v) || 100_000))}
              />
              <TextInput
                label="Learning Rate"
                type="number"
                value={String(form.learningRate)}
                onChange={v => patchForm('learningRate', Math.max(0, parseFloat(v) || 0.005))}
              />
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                Allowed Strategies
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {STRATEGY_OPTIONS.map(s => {
                  const checked = form.allowedStrategies.includes(s.value);
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => toggleStrategy(s.value)}
                      className={`text-left px-3 py-2.5 rounded-lg border-2 transition-colors ${
                        checked
                          ? 'border-brand bg-brand/5 text-brand'
                          : 'border-input-border text-text-secondary hover:border-brand/50'
                      }`}
                    >
                      <div className="text-sm font-medium">{s.label}</div>
                      <div className="text-xs text-text-muted mt-0.5">{s.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                Risk Profile
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SliderInput
                  label="Max Drawdown"
                  value={form.riskProfile.maxDrawdown * 100}
                  onChange={v =>
                    setForm(f => ({
                      ...f,
                      riskProfile: { ...f.riskProfile, maxDrawdown: v / 100 },
                    }))
                  }
                  min={5}
                  max={50}
                  step={5}
                  formatValue={v => `${v.toFixed(0)}%`}
                  minLabel="5% (tight)"
                  maxLabel="50% (loose)"
                  hint="Episode ends early when cumulative loss exceeds this threshold."
                />
                <SliderInput
                  label="Aggression Level"
                  value={form.riskProfile.aggressionLevel * 100}
                  onChange={v =>
                    setForm(f => ({
                      ...f,
                      riskProfile: { ...f.riskProfile, aggressionLevel: v / 100 },
                    }))
                  }
                  min={0}
                  max={100}
                  step={10}
                  formatValue={v => aggressionLabel(v / 100)}
                  minLabel="Passive"
                  maxLabel="Aggressive"
                  hint="Scales position size, exploration rate, and loss penalty."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={createSession}
                disabled={submitting}
                className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Queueing…' : 'Start Training'}
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

        {/* ── Training sessions table ─────────────────────────────────────────── */}
        <div className="mt-6">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-3">
            Training Sessions
          </p>

          {sessions.loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 bg-card rounded-lg animate-pulse" />
              ))}
            </div>
          ) : sessions.error ? (
            <AgentError message={sessions.error} onRetry={sessions.refetch} />
          ) : (
            <div className="rounded-lg overflow-hidden border border-table-alt">
              <TableHeadSearchable
                searchPlaceholder="Search by name, description, algorithm…"
                searchValue={sessionSearch}
                onSearchChange={setSessionSearch}
                hideMyWallet
                inMyWallet={false}
                onInMyWalletChange={() => {}}
                filterOptions={[]}
                activeFilters={[]}
                onFiltersChange={() => {}}
                customCategoriesTitle="Status"
                customCategories={SESSION_STATUSES}
                activeCustomCategories={activeStatuses}
                onCustomCategoriesChange={setActiveStatuses}
                headers={SESSION_HEADERS}
                colSpan={SESSION_HEADERS.length}
                tab={sessionSortCol}
                reverse={sessionSortReverse}
                tabOnChange={handleSessionSort}
                actionCol
              />
              <TableBody>
                {visibleSessions.length === 0 ? (
                  <TableRowEmpty>
                    {sessions.data?.length ? 'No sessions match your filters.' : 'No sessions yet.'}
                  </TableRowEmpty>
                ) : (
                  (visibleSessions.map(s => (
                    <TableRow
                      key={s.id}
                      colSpan={SESSION_HEADERS.length}
                      headers={SESSION_HEADERS}
                      tab={sessionSortCol}
                      actionCol={
                        <div className="flex items-center justify-end gap-1">
                          {(s.status === 'QUEUED' || s.status === 'RUNNING') && (
                            <button
                              type="button"
                              disabled={cancelling === s.id}
                              onClick={() => cancelSession(s.id)}
                              title="Cancel"
                              className="p-1.5 rounded text-yellow-400 hover:bg-yellow-400/20 transition-colors disabled:opacity-50"
                            >
                              <FontAwesomeIcon icon={faBan} className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={deleting === s.id}
                            onClick={() => deleteSession(s.id)}
                            title="Hard delete"
                            className="p-1.5 rounded text-error hover:bg-error/20 transition-colors disabled:opacity-50"
                          >
                            <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                          </button>
                        </div>
                      }
                    >
                      <div className="text-left">
                        <CellEditable value={s.name} onSave={v => renameSession(s.id, v)} />
                        {s.description && (
                          <div className="text-text-muted text-xs mt-0.5">{s.description}</div>
                        )}
                      </div>
                      <span>{s.currency}</span>
                      <span>{s.algorithm}</span>
                      <span>
                        <Badge
                          text={s.status}
                          variant="custom"
                          customColor={SESSION_STATUS_BADGE[s.status].color}
                          customBgColor={SESSION_STATUS_BADGE[s.status].bg}
                        />
                      </span>
                      <span className="text-text-muted">{fmtDate(s.createdAt)}</span>
                    </TableRow>
                  )) as any)
                )}
              </TableBody>
            </div>
          )}
        </div>

        {/* ── Trained models table ────────────────────────────────────────────── */}
        <div className="mt-8">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-3">
            Trained Models
          </p>

          {models.loading ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-14 bg-card rounded-lg animate-pulse" />
              ))}
            </div>
          ) : models.error ? (
            <AgentError message={models.error} onRetry={models.refetch} />
          ) : (
            <div className="rounded-lg overflow-hidden border border-table-alt">
              <TableHeadSearchable
                searchPlaceholder="Search by name or algorithm…"
                searchValue={modelSearch}
                onSearchChange={setModelSearch}
                hideMyWallet
                inMyWallet={false}
                onInMyWalletChange={() => {}}
                filterOptions={[]}
                activeFilters={[]}
                onFiltersChange={() => {}}
                customCategoriesTitle="Storage"
                customCategories={MODEL_STORAGE_TYPES}
                activeCustomCategories={activeStorageTypes}
                onCustomCategoriesChange={setActiveStorageTypes}
                headers={MODEL_HEADERS}
                colSpan={MODEL_HEADERS.length}
                tab={modelSortCol}
                reverse={modelSortReverse}
                tabOnChange={handleModelSort}
                actionCol
              />
              <TableBody>
                {visibleModels.length === 0 ? (
                  <TableRowEmpty>
                    {models.data?.length
                      ? 'No models match your filters.'
                      : 'No trained models yet.'}
                  </TableRowEmpty>
                ) : (
                  (visibleModels.map(m => (
                    <TableRow
                      key={m.id}
                      colSpan={MODEL_HEADERS.length}
                      headers={MODEL_HEADERS}
                      tab={modelSortCol}
                      actionCol={
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            disabled={pushingBacktest === m.id}
                            onClick={() => pushToBacktest(m)}
                            title="Push to backtest"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium text-brand border border-brand/30 hover:bg-brand/10 transition-colors disabled:opacity-50"
                          >
                            <FontAwesomeIcon icon={faPlay} className="w-2.5 h-2.5" />
                            {pushingBacktest === m.id ? 'Queuing…' : 'Backtest'}
                          </button>
                        </div>
                      }
                    >
                      <CellEditable
                        value={resolveModelName(m)}
                        onSave={v => renameModel(m.id, v)}
                      />
                      <div className="font-mono text-xs">
                        {m.metadata?.obs_version && m.metadata?.obs_dims ? (
                          <>
                            <span className="text-text-secondary">{m.metadata.obs_version}</span>
                            <span className="text-text-muted mx-1">·</span>
                            <span className="text-text-primary">{m.metadata.obs_dims}f</span>
                          </>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </div>
                      <span className="text-text-secondary text-xs font-mono">
                        {m.metadata?.policy ?? '—'}
                      </span>
                      <span className="text-text-secondary">{m.session?.algorithm ?? '—'}</span>
                      <span className="font-mono text-text-secondary">
                        {fmtSteps(m.session?.totalTimesteps)}
                      </span>
                      <span className="font-mono text-text-primary">
                        {m.meanReward !== undefined ? fmt(m.meanReward, 3) : '—'}
                      </span>
                      <span className="text-text-secondary">{fmtSize(m.sizeBytes)}</span>
                      <span className="text-text-muted">{fmtDate(m.createdAt)}</span>
                    </TableRow>
                  )) as any)
                )}
              </TableBody>
            </div>
          )}
        </div>
      </Section>
    </>
  );
}
