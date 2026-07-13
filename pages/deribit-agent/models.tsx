import Head from 'next/head';
import { useState, useMemo } from 'react';
import { AgentError } from '@/components/features/DeribitAgent/AgentError';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBrain,
  faPlus,
  faBan,
  faTrash,
  faPlay,
  faChevronDown,
  faChevronUp,
} from '@fortawesome/free-solid-svg-icons';
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

// Quick-selector chips — check/uncheck all actions in the group
const STRATEGY_CHIPS = [
  { value: 'short_call', label: 'Short Call', ids: [1, 2, 3, 4, 5, 6, 7] },
  { value: 'short_put', label: 'Short Put', ids: [8, 9, 10, 11, 12] },
  {
    value: 'delta_neutral',
    label: 'Delta Neutral',
    ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  },
];

// 27-action list grouped for display
const ACTION_GROUPS = [
  {
    label: 'Open Calls',
    actions: [
      { id: 1, label: 'ATM (Δ50)' },
      { id: 2, label: 'OTM Δ40' },
      { id: 3, label: 'OTM Δ30' },
      { id: 4, label: 'OTM Δ20' },
      { id: 5, label: 'ITM Δ60' },
      { id: 6, label: 'ITM Δ70' },
      { id: 7, label: 'ITM Δ80' },
    ],
  },
  {
    label: 'Open Puts',
    actions: [
      { id: 8, label: 'ATM (Δ50)' },
      { id: 9, label: 'OTM Δ40' },
      { id: 10, label: 'OTM Δ30' },
      { id: 11, label: 'OTM Δ20' },
      { id: 12, label: 'Far OTM Δ10' },
    ],
  },
  {
    label: 'Strangles',
    actions: [
      { id: 13, label: 'Δ40/Δ40' },
      { id: 14, label: 'Δ30/Δ30' },
      { id: 15, label: 'Δ20/Δ20' },
    ],
  },
  {
    label: 'Close All',
    actions: [{ id: 16, label: 'Close all positions' }],
  },
  {
    label: 'Close Call at Profit',
    actions: [
      { id: 17, label: '≥25%' },
      { id: 18, label: '≥50%' },
      { id: 19, label: '≥60%' },
      { id: 20, label: '≥70%' },
      { id: 21, label: '≥80%' },
    ],
  },
  {
    label: 'Close Put at Profit',
    actions: [
      { id: 22, label: '≥25%' },
      { id: 23, label: '≥50%' },
      { id: 24, label: '≥60%' },
      { id: 25, label: '≥70%' },
      { id: 26, label: '≥80%' },
    ],
  },
];

const ALL_ACTION_IDS = ACTION_GROUPS.flatMap(g => g.actions.map(a => a.id));

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

const BLANK_SESSION = {
  name: '',
  description: '',
  currency: 'BTC',
  dataFrom: '2022-01-01',
  dataTo: new Date().toISOString().slice(0, 10),
  resolution: '1D',
  algorithm: 'PPO',
  allowedActions: [...ALL_ACTION_IDS] as number[],
  expiryDaysMin: 7,
  expiryDaysMax: 7,
  rollDteThreshold: 0,
  riskProfile: { maxDrawdown: 0.2, aggressionLevel: 0.5 } as Required<RiskProfile>,
  totalTimesteps: 100_000,
  learningRate: 0.005,
  // Execution defaults (stored in hyperparams.env)
  positionSizePct: 0.8,
  maxPositionBtc: 5.0,
  minOrderSize: 0.1,
  maxMarginRatio: 0.8,
  deltaThreshold: 0.3,
  deltaPenaltyCoef: 0.002,
  riskFreeRate: 0.05,
  fastMargin: true,
  showExecDefaults: false,
  // Continue-training fields
  resumeFromModelId: '',
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
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

function fmtSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function ModelsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [createMode, setCreateMode] = useState<'new' | 'continue'>('new');
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

  const isChipActive = (ids: number[]) => ids.every(id => form.allowedActions.includes(id));

  const toggleChip = (ids: number[]) => {
    if (isChipActive(ids)) {
      setForm(f => ({ ...f, allowedActions: f.allowedActions.filter(id => !ids.includes(id)) }));
    } else {
      setForm(f => ({ ...f, allowedActions: [...new Set([...f.allowedActions, ...ids])] }));
    }
  };

  const toggleAction = (id: number) => {
    setForm(f => ({
      ...f,
      allowedActions: f.allowedActions.includes(id)
        ? f.allowedActions.filter(x => x !== id)
        : [...f.allowedActions, id],
    }));
  };

  const createSession = async () => {
    if (!form.name || !form.dataFrom || !form.dataTo) {
      toast.error('Name, data from and data to are required.');
      return;
    }
    if (createMode === 'new' && !form.currency) {
      toast.error('Currency is required.');
      return;
    }
    if (createMode === 'continue' && !form.resumeFromModelId) {
      toast.error('Select a base model to continue training from.');
      return;
    }
    if (!form.allowedActions.length) {
      toast.error('Select at least one action to allow during training.');
      return;
    }
    setSubmitting(true);
    try {
      await agentFetch('/training/sessions', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          ...(createMode === 'new' && { currency: form.currency, algorithm: form.algorithm }),
          ...(createMode === 'continue' && { resumeFromModelId: form.resumeFromModelId }),
          dataFrom: new Date(form.dataFrom).toISOString(),
          dataTo: new Date(form.dataTo + 'T23:59:59').toISOString(),
          resolution: form.resolution,
          allowedActions: form.allowedActions,
          expiryDaysMin: form.expiryDaysMin,
          expiryDaysMax: form.expiryDaysMax,
          rollDteThreshold: form.rollDteThreshold,
          riskProfile: form.riskProfile,
          hyperparams: {
            training: {
              total_timesteps: form.totalTimesteps,
              learning_rate: form.learningRate,
            },
            env: {
              position_size_pct: form.positionSizePct,
              max_position_btc: form.maxPositionBtc,
              min_order_size: form.minOrderSize,
              max_margin_ratio: form.maxMarginRatio,
              delta_threshold: form.deltaThreshold,
              delta_penalty_coef: form.deltaPenaltyCoef,
              risk_free_rate: form.riskFreeRate,
              fast_margin: form.fastMargin,
            },
          },
        } satisfies CreateSessionBody),
      });
      toast.success('Training session queued.');
      setForm(BLANK_SESSION);
      setCreateMode('new');
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
              onClick={() => {
                setShowCreate(v => !v);
                setCreateMode('new');
                setForm(BLANK_SESSION);
              }}
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
            <p className="text-sm font-semibold text-text-primary mb-4">Create Training Session</p>

            {/* Mode toggle */}
            <div className="flex gap-1 p-1 bg-surface rounded-lg w-fit mb-5">
              <button
                type="button"
                onClick={() => setCreateMode('new')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  createMode === 'new'
                    ? 'bg-card text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                New Model
              </button>
              <button
                type="button"
                onClick={() => setCreateMode('continue')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  createMode === 'continue'
                    ? 'bg-card text-text-primary shadow-sm'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                Continue Training
              </button>
            </div>

            {/* Base model selector (continue mode only) */}
            {createMode === 'continue' &&
              (() => {
                const completedModels = (models.data ?? []).filter(
                  m => !m.session?.status || m.session.status === 'COMPLETED'
                );
                const selectedBase = completedModels.find(m => m.id === form.resumeFromModelId);
                return (
                  <>
                    <SelectInput
                      label="Base Model"
                      options={[
                        { value: '', label: 'Select a model to continue from…' },
                        ...completedModels.map(m => ({
                          value: m.id,
                          label: `${resolveModelName(m)} · ${m.session?.currency ?? '?'} · ${m.session?.algorithm ?? 'PPO'}`,
                        })),
                      ]}
                      value={form.resumeFromModelId}
                      onChange={v => patchForm('resumeFromModelId', v)}
                    />
                    {selectedBase && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-text-muted">Inherits:</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-surface border border-input-border text-text-secondary">
                          {selectedBase.session?.currency ?? '?'}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-surface border border-input-border text-text-secondary">
                          {selectedBase.session?.algorithm ?? 'PPO'}
                        </span>
                        {selectedBase.metadata?.obs_version && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-surface border border-input-border text-text-muted">
                            obs {selectedBase.metadata.obs_version}
                          </span>
                        )}
                      </div>
                    )}
                  </>
                );
              })()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                label="Name"
                placeholder="btc-ppo-v2"
                value={form.name}
                onChange={v => patchForm('name', v)}
              />
              <TextInput
                label="Description (optional)"
                placeholder="Short description"
                value={form.description ?? ''}
                onChange={v => patchForm('description', v)}
              />
              {createMode === 'new' && (
                <>
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
                </>
              )}
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
                value={String(form.totalTimesteps)}
                onChange={v => patchForm('totalTimesteps', Math.max(1, parseInt(v) || 100_000))}
              />
              <TextInput
                label="Learning Rate"
                value={String(form.learningRate)}
                onChange={v => patchForm('learningRate', Math.max(0, parseFloat(v) || 0.005))}
              />
            </div>

            {/* ── Allowed Actions ────────────────────────────────────────── */}
            <div className="mt-5">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Allowed Actions
              </p>
              {/* Quick-selector chips */}
              <div className="flex gap-2 flex-wrap mb-3">
                {STRATEGY_CHIPS.map(chip => {
                  const active = isChipActive(chip.ids);
                  return (
                    <button
                      key={chip.value}
                      type="button"
                      onClick={() => toggleChip(chip.ids)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                        active
                          ? 'border-brand bg-brand/10 text-brand'
                          : 'border-input-border text-text-secondary hover:border-brand/40'
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, allowedActions: [...ALL_ACTION_IDS] }))}
                  className="px-3 py-1.5 rounded-full border border-input-border text-xs text-text-muted hover:text-text-primary transition-colors"
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, allowedActions: [] }))}
                  className="px-3 py-1.5 rounded-full border border-input-border text-xs text-text-muted hover:text-text-primary transition-colors"
                >
                  None
                </button>
              </div>
              {/* Per-action checkboxes grouped */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3">
                {ACTION_GROUPS.map(group => (
                  <div key={group.label}>
                    <p className="text-xs text-text-muted font-medium mb-1">{group.label}</p>
                    <div className="space-y-1">
                      {group.actions.map(a => (
                        <label key={a.id} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={form.allowedActions.includes(a.id)}
                            onChange={() => toggleAction(a.id)}
                            className="w-3.5 h-3.5 accent-brand"
                          />
                          <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors">
                            {a.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── DTE Range ─────────────────────────────────────────────── */}
            <div className="mt-5">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                Expiry (DTE)
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <TextInput
                  label="Min DTE"
                  value={String(form.expiryDaysMin)}
                  onChange={v => patchForm('expiryDaysMin', Math.max(1, parseInt(v) || 7))}
                />
                <TextInput
                  label="Max DTE"
                  value={String(form.expiryDaysMax)}
                  onChange={v =>
                    patchForm('expiryDaysMax', Math.max(form.expiryDaysMin, parseInt(v) || 7))
                  }
                />
                <SliderInput
                  label="Roll threshold (DTE)"
                  value={form.rollDteThreshold}
                  onChange={v => patchForm('rollDteThreshold', v)}
                  min={0}
                  max={7}
                  step={1}
                  formatValue={v => (v === 0 ? 'Hold to expiry' : `Roll at ≤${v}d`)}
                  minLabel="Hold"
                  maxLabel="Roll early"
                  hint="Close positions early when DTE reaches this threshold."
                />
              </div>
            </div>

            {/* ── Risk Profile ──────────────────────────────────────────── */}
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

            {/* ── Execution Defaults (collapsible) ──────────────────────── */}
            <div className="mt-5 border-t border-surface pt-4">
              <button
                type="button"
                className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider hover:text-text-primary transition-colors"
                onClick={() => patchForm('showExecDefaults', !form.showExecDefaults)}
              >
                <FontAwesomeIcon
                  icon={form.showExecDefaults ? faChevronUp : faChevronDown}
                  className="w-3 h-3"
                />
                Execution Defaults
              </button>
              {form.showExecDefaults && (
                <div className="mt-4 space-y-5">
                  <div>
                    <p className="text-xs text-text-muted mb-3">Position Sizing</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <SliderInput
                        label="Position Size %"
                        value={form.positionSizePct * 100}
                        onChange={v => patchForm('positionSizePct', v / 100)}
                        min={5}
                        max={100}
                        step={5}
                        formatValue={v => `${v.toFixed(0)}%`}
                        minLabel="5%"
                        maxLabel="100%"
                        hint="Fraction of margin allocated per leg."
                      />
                      <TextInput
                        label="Max Position BTC"
                        value={String(form.maxPositionBtc)}
                        onChange={v => patchForm('maxPositionBtc', parseFloat(v) || 5)}
                      />
                      <TextInput
                        label="Min Order Size BTC"
                        value={String(form.minOrderSize)}
                        onChange={v => patchForm('minOrderSize', parseFloat(v) || 0.1)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SliderInput
                      label="Max Margin Ratio"
                      value={form.maxMarginRatio * 100}
                      onChange={v => patchForm('maxMarginRatio', v / 100)}
                      min={50}
                      max={95}
                      step={5}
                      formatValue={v => `${v.toFixed(0)}%`}
                      minLabel="50%"
                      maxLabel="95%"
                      hint="Max portfolio margin utilization before blocking new trades."
                    />
                    <SliderInput
                      label="Delta Threshold"
                      value={form.deltaThreshold * 100}
                      onChange={v => patchForm('deltaThreshold', v / 100)}
                      min={10}
                      max={80}
                      step={5}
                      formatValue={v => `${v.toFixed(0)}%`}
                      minLabel="10% (strict)"
                      maxLabel="80% (loose)"
                      hint="Net delta overshoot allowed before penalty kicks in."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TextInput
                      label="Delta Penalty Coef"
                      value={String(form.deltaPenaltyCoef)}
                      onChange={v => patchForm('deltaPenaltyCoef', parseFloat(v) || 0.002)}
                    />
                    <TextInput
                      label="Risk Free Rate"
                      value={String(form.riskFreeRate)}
                      onChange={v => patchForm('riskFreeRate', parseFloat(v) || 0.05)}
                    />
                    <div>
                      <p className="text-xs text-text-muted mb-2">Fast Margin</p>
                      <button
                        type="button"
                        onClick={() => patchForm('fastMargin', !form.fastMargin)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.fastMargin ? 'bg-brand' : 'bg-input-border'}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.fastMargin ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                      <p className="text-xs text-text-muted mt-1">
                        Skip IV shocks — faster, less precise.
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
                onClick={() => {
                  setShowCreate(false);
                  setCreateMode('new');
                  setForm(BLANK_SESSION);
                }}
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
                      noFirstHeader
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
                      noFirstHeader
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
