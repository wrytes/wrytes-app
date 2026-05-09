import { useState, useEffect, useCallback } from 'react';

// Strip any accidental path/key from the base URL — only the origin is used.
function parseOrigin(raw: string): string {
  if (!raw) return '';
  try {
    return new URL(raw).origin;
  } catch {
    return raw;
  }
}

const BASE = parseOrigin(process.env.NEXT_PUBLIC_DERIBIT_AGENT_URL ?? '');
const KEY = process.env.NEXT_PUBLIC_DERIBIT_AGENT_API_KEY ?? '';

export async function agentFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE) throw new Error('NEXT_PUBLIC_DERIBIT_AGENT_URL is not configured.');
  if (!KEY) throw new Error('NEXT_PUBLIC_DERIBIT_AGENT_API_KEY is not configured.');

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': KEY,          // ← header auth, as required by api-key.guard.ts
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    let message = `HTTP ${res.status}`;
    // Don't leak HTML error pages into the UI
    if (body && !body.trimStart().startsWith('<')) {
      try {
        const json = JSON.parse(body);
        message = json.message ?? json.error ?? message;
      } catch {
        message = body.slice(0, 200);
      }
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Expected JSON but got ${contentType || 'unknown content-type'}.`);
  }

  return res.json();
}

export function useDeribitFetch<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    setError(null);
    try {
      const result = await agentFetch<T>(path);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => { run(); }, [run]);

  return { data, loading, error, refetch: run };
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AccountSummary {
  currency: string;
  equity: number;
  balance: number;
  margin_balance: number;
  maintenance_margin: number;
  projected_initial_margin: number;
  available_funds: number;
  projected_delta_total: number;
}

export interface AccountSummariesResponse {
  summaries: AccountSummary[];
}

export type RunStatus = 'ACTIVE' | 'PAUSED' | 'STOPPED' | 'COMPLETED' | 'ERROR';
export type RunType = 'BACKTEST' | 'PAPER' | 'LIVE';
export type SessionStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface AgentRun {
  id: string;
  name: string;
  currency: string;
  status: RunStatus;
  runType: RunType;
  deribitAccountId?: string;
  initialCapitalBtc: number;
  currentCapitalBtc?: number;
  realizedPnlBtc?: number;
  notes?: string;
  sessionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentAction {
  id: string;
  actionType: string;
  timestamp: string;
  instrument?: string;
  quantity?: number;
  price?: number;
  btcPrice?: number;
  delta?: number;
  ivRank?: number;
  pnlBtc?: number;
  marginBalanceBtc?: number;
  reason?: string;
}

export interface TrainingSession {
  id: string;
  name: string;
  description?: string;
  currency: string;
  status: SessionStatus;
  algorithm: string;
  dataFrom: string;
  dataTo: string;
  resolution: string;
  createdAt: string;
  updatedAt: string;
  model?: { id: string; name: string } | null;
  hyperparams?: {
    env?: Record<string, unknown>;
    training?: Record<string, unknown>;
  };
}

export interface ModelManifest {
  obs_version:  string;
  obs_dims:     number;
  obs_features: string[];
  action_dims:  number;
  data_columns: string[];
  env_version:  string;
  policy:       string;
}

export interface TrainedModel {
  id: string;
  name: string;
  sessionId: string;
  storagePath: string;
  storageType: string;
  sizeBytes?: number;
  meanReward?: number;
  stdReward?: number;
  sharpeRatio?: number;
  maxDrawdown?: number;
  winRate?: number;
  metadata?: Partial<ModelManifest>;
  createdAt: string;
  session?: { name: string; algorithm: string; currency: string; totalTimesteps?: number | null };
}

export interface DeribitAccount {
  id: string;
  userId: string;
  label: string;
  clientId: string;
  baseUrl: string;
  isTestnet: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrackedInstrument {
  instrument: string;
  resolution: string;
}

export interface DataStatus {
  tracked: TrackedInstrument[];
  candles: Record<string, unknown>;
  options: Record<string, unknown>;
}

export interface CreateRunBody {
  name: string;
  currency: string;
  runType?: RunType;
  deribitAccountId?: string;
  initialCapitalBtc: number;
  sessionId?: string;
  notes?: string;
}

export interface ExecuteRunBody {
  dataFrom?: string;
  dataTo?: string;
  envOverrides?: {
    // Conditioning inputs (set at inference time)
    max_drawdown_limit?: number;
    aggression_level?: number;
    allowed_actions?: string[];
    randomize_conditioning?: boolean;
    // Core env params
    expiry_days?: number;
    position_size_pct?: number;
    max_position_btc?: number;
    delta_threshold?: number;
    delta_penalty_coef?: number;
    max_margin_ratio?: number;
    risk_free_rate?: number;
    loss_multiplier?: number;
    loss_threshold?: number;
    capital_eff_bonus?: number;
  };
}

export interface RiskProfile {
  maxDrawdown?: number;
  aggressionLevel?: number;
}

export interface CreateSessionBody {
  name: string;
  description?: string;
  currency: string;
  dataFrom: string;
  dataTo: string;
  resolution?: string;
  algorithm?: string;
  allowedStrategies?: string[];
  riskProfile?: RiskProfile;
  hyperparams?: Record<string, any>;
}

export interface CreateAccountBody {
  label?: string;
  clientId: string;
  clientSecret: string;
  baseUrl?: string;
  isTestnet?: boolean;
  isDefault?: boolean;
}

export interface UpdateAccountBody {
  label?: string;
  clientId?: string;
  clientSecret?: string;
  baseUrl?: string;
  isTestnet?: boolean;
}
