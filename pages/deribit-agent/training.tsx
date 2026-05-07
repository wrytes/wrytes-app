import Head from 'next/head';
import { useState } from 'react';
import { AgentError } from '@/components/features/DeribitAgent/AgentError';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBrain, faPlus, faTrash, faDatabase, faBan, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { Section, PageHeader } from '@/components/ui/Layout';
import Card from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import TextInput from '@/components/ui/Input/TextInput';
import { SelectInput } from '@/components/ui/Input/SelectInput';
import {
  useDeribitFetch, agentFetch,
  type TrainingSession, type TrainedModel, type CreateSessionBody, type RiskProfile,
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

const RESOLUTION_OPTIONS = [
  { value: '1D', label: '1D' },
  { value: '1H', label: '1H' },
  { value: '4H', label: '4H' },
];

const SESSION_STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'QUEUED', label: 'Queued' },
  { value: 'RUNNING', label: 'Running' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const STRATEGY_OPTIONS = [
  { value: 'STRANGLE', label: 'Strangle', desc: 'Sell OTM call + put simultaneously' },
  { value: 'STRADDLE', label: 'Straddle', desc: 'Sell ATM call + put' },
  { value: 'DELTA_NEUTRAL', label: 'Delta Neutral', desc: 'Hedge to near-zero net delta' },
  { value: 'COVERED_CALL', label: 'Covered Call', desc: 'Sell calls against a long position' },
  { value: 'CASH_SECURED_PUT', label: 'Cash-Secured Put', desc: 'Sell puts with full margin reserved' },
  { value: 'IRON_CONDOR', label: 'Iron Condor', desc: 'Sell OTM strangle, buy further OTM wings' },
];

const BLANK_SESSION: CreateSessionBody & { allowedStrategies: string[]; riskProfile: Required<RiskProfile> } = {
  name: '',
  description: '',
  currency: 'BTC',
  dataFrom: '',
  dataTo: '',
  resolution: '1D',
  algorithm: 'PPO',
  allowedStrategies: ['STRANGLE', 'DELTA_NEUTRAL'],
  riskProfile: { maxDrawdown: 0.20, aggressionLevel: 0.5 },
};

function AggressionLabel(level: number): string {
  if (level <= 0.2) return 'Very Passive';
  if (level <= 0.4) return 'Passive';
  if (level <= 0.6) return 'Balanced';
  if (level <= 0.8) return 'Aggressive';
  return 'Very Aggressive';
}

export default function DeribitTrainingPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(BLANK_SESSION);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  const sessionPath = statusFilter
    ? `/training/sessions?status=${statusFilter}`
    : '/training/sessions';

  const sessions = useDeribitFetch<TrainingSession[]>(sessionPath);
  const models = useDeribitFetch<TrainedModel[]>('/training/models');

  const patchForm = (k: keyof typeof form, v: unknown) =>
    setForm(f => ({ ...f, [k]: v }));

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
      const body: CreateSessionBody = {
        name: form.name,
        description: form.description || undefined,
        currency: form.currency,
        dataFrom: form.dataFrom,
        dataTo: form.dataTo,
        resolution: form.resolution,
        algorithm: form.algorithm,
        allowedStrategies: form.allowedStrategies,
        riskProfile: form.riskProfile,
      };
      await agentFetch('/training/sessions', {
        method: 'POST',
        body: JSON.stringify(body),
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
    if (!confirm('Hard-delete this session? This also removes its model and all associated agent runs.')) return;
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

  return (
    <>
      <Head>
        <title>Deribit Agent — Training</title>
      </Head>

      <Section>
        <PageHeader
          title="Training"
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

        {/* Create form */}
        {showCreate && (
          <Card className="mt-4">
            <p className="text-sm font-semibold text-text-primary mb-4">Create Training Model</p>

            {/* Basic config */}
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
                label="Data From (ISO)"
                placeholder="2024-01-01T00:00:00Z"
                value={form.dataFrom}
                onChange={v => patchForm('dataFrom', v)}
              />
              <TextInput
                label="Data To (ISO)"
                placeholder="2024-12-31T23:59:59Z"
                value={form.dataTo}
                onChange={v => patchForm('dataTo', v)}
              />
            </div>

            {/* Strategy whitelist */}
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

            {/* Risk profile */}
            <div className="mt-5">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                Risk Profile
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Max drawdown */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm text-text-secondary">Max Drawdown</label>
                    <span className="text-sm font-mono text-text-primary">
                      {(form.riskProfile.maxDrawdown * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="5"
                    value={form.riskProfile.maxDrawdown * 100}
                    onChange={e =>
                      setForm(f => ({
                        ...f,
                        riskProfile: { ...f.riskProfile, maxDrawdown: parseInt(e.target.value) / 100 },
                      }))
                    }
                    className="w-full accent-brand"
                  />
                  <div className="flex justify-between text-xs text-text-muted mt-1">
                    <span>5% (tight)</span>
                    <span>50% (loose)</span>
                  </div>
                  <p className="text-xs text-text-muted mt-1.5">
                    Episode ends early when cumulative loss exceeds this threshold.
                  </p>
                </div>

                {/* Aggression level */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm text-text-secondary">Aggression Level</label>
                    <span className="text-sm font-medium text-text-primary">
                      {AggressionLabel(form.riskProfile.aggressionLevel)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={form.riskProfile.aggressionLevel * 100}
                    onChange={e =>
                      setForm(f => ({
                        ...f,
                        riskProfile: { ...f.riskProfile, aggressionLevel: parseInt(e.target.value) / 100 },
                      }))
                    }
                    className="w-full accent-brand"
                  />
                  <div className="flex justify-between text-xs text-text-muted mt-1">
                    <span>Passive</span>
                    <span>Aggressive</span>
                  </div>
                  <p className="text-xs text-text-muted mt-1.5">
                    Scales position size, exploration rate, and loss penalty.
                  </p>
                </div>
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

        {/* Sessions */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">
              Training Sessions
            </p>
            <div className="flex gap-2 flex-wrap">
              {SESSION_STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatusFilter(opt.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === opt.value
                      ? 'bg-brand text-white'
                      : 'bg-surface text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {sessions.loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-card rounded-lg animate-pulse" />
              ))}
            </div>
          ) : sessions.error ? (
            <AgentError message={sessions.error} onRetry={sessions.refetch} />
          ) : !sessions.data?.length ? (
            <Card>
              <p className="text-text-muted text-sm text-center py-4">No sessions found.</p>
            </Card>
          ) : (
            <Card className="overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface">
                    <th className="text-left text-text-muted font-medium px-4 py-3">Name</th>
                    <th className="text-left text-text-muted font-medium px-4 py-3">Currency</th>
                    <th className="text-left text-text-muted font-medium px-4 py-3">Algorithm</th>
                    <th className="text-left text-text-muted font-medium px-4 py-3">Status</th>
                    <th className="text-left text-text-muted font-medium px-4 py-3">Created</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {sessions.data.map((s, i) => (
                    <tr key={s.id} className={i % 2 === 0 ? '' : 'bg-surface/30'}>
                      <td className="px-4 py-3 text-text-primary font-medium">
                        <div>{s.name}</div>
                        {s.description && (
                          <div className="text-text-muted text-xs">{s.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{s.currency}</td>
                      <td className="px-4 py-3 text-text-secondary">{s.algorithm}</td>
                      <td className="px-4 py-3">
                        <Badge
                          text={s.status}
                          variant="custom"
                          customColor={SESSION_STATUS_BADGE[s.status].color}
                          customBgColor={SESSION_STATUS_BADGE[s.status].bg}
                        />
                      </td>
                      <td className="px-4 py-3 text-text-muted">{fmtDate(s.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
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
                            title="Hard delete (cascades model + runs)"
                            className="p-1.5 rounded text-error hover:bg-error/20 transition-colors disabled:opacity-50"
                          >
                            <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>

        {/* Trained models */}
        <div className="mt-8">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-3">
            Trained Models
          </p>

          {models.loading ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-20 bg-card rounded-lg animate-pulse" />
              ))}
            </div>
          ) : models.error ? (
            <AgentError message={models.error} onRetry={models.refetch} />
          ) : !models.data?.length ? (
            <Card>
              <p className="text-text-muted text-sm text-center py-4">No models yet.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {models.data.map(model => {
                const isExpanded = expandedModel === model.id;
                return (
                  <Card key={model.id} className="p-0 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setExpandedModel(isExpanded ? null : model.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-surface/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FontAwesomeIcon icon={faDatabase} className="w-3.5 h-3.5 text-brand flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="font-medium text-text-primary">{model.name}</span>
                          <span className="text-text-muted text-xs ml-3">{fmtDate(model.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {model.sharpeRatio !== undefined && (
                          <span className="text-xs text-text-secondary">
                            Sharpe <span className="font-mono text-text-primary">{fmt(model.sharpeRatio, 2)}</span>
                          </span>
                        )}
                        {model.winRate !== undefined && (
                          <span className="text-xs text-text-secondary">
                            Win <span className="font-mono text-text-primary">{fmt(model.winRate * 100, 1)}%</span>
                          </span>
                        )}
                        <span className="text-xs font-mono text-text-muted bg-surface px-2 py-0.5 rounded">
                          {model.storageType}
                        </span>
                        <FontAwesomeIcon
                          icon={isExpanded ? faChevronUp : faChevronDown}
                          className="w-3 h-3 text-text-secondary"
                        />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-surface px-4 py-4 bg-surface/10">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                          {[
                            ['Mean Reward', fmt(model.meanReward, 3)],
                            ['Std Reward', fmt(model.stdReward, 3)],
                            ['Sharpe Ratio', fmt(model.sharpeRatio, 3)],
                            ['Max Drawdown', model.maxDrawdown !== undefined ? `${fmt(model.maxDrawdown, 2)}%` : '—'],
                            ['Win Rate', model.winRate !== undefined ? `${fmt(model.winRate * 100, 1)}%` : '—'],
                            ['Size', model.sizeBytes ? `${(model.sizeBytes / 1024 / 1024).toFixed(1)} MB` : '—'],
                          ].map(([label, value]) => (
                            <div key={label}>
                              <span className="text-text-muted text-xs block">{label}</span>
                              <span className="text-text-primary font-mono">{value}</span>
                            </div>
                          ))}
                        </div>
                        <p className="mt-3 text-text-muted text-xs font-mono truncate" title={model.storagePath}>
                          {model.storagePath}
                        </p>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Section>
    </>
  );
}
