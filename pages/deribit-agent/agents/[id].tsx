import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  LineController,
  BarController,
  DoughnutController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
  type ChartConfiguration,
} from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faRobot,
  faChevronDown,
  faChevronUp,
  faPlay,
  faPause,
  faStop,
  faRotateRight,
} from '@fortawesome/free-solid-svg-icons';
import { Section, PageHeader } from '@/components/ui/Layout';
import Card from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AgentError } from '@/components/features/DeribitAgent/AgentError';
import TextInput from '@/components/ui/Input/TextInput';
import SliderInput from '@/components/ui/Input/SliderInput';
import { useDeribitFetch, agentFetch, type AgentRun, type AgentAction, type ExecutionSettings } from '@/lib/deribit-agent/client';
import { RUN_STATUS_BADGE } from '@/lib/deribit-agent/ui';

const EXEC_STRATEGY_CHIPS = [
  { value: 'short_call',    label: 'Short Call',    desc: 'Calls Δ20–Δ80', ids: [1,2,3,4,5,6,7] },
  { value: 'short_put',     label: 'Short Put',     desc: 'Puts Δ10–Δ50',  ids: [8,9,10,11,12] },
  { value: 'delta_neutral', label: 'Delta Neutral', desc: 'Balanced call + put', ids: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15] },
];
const ALL_EXEC_ACTION_IDS = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26];

function aggressionLabel(v: number) {
  if (v <= 0.2) return 'Very Passive';
  if (v <= 0.4) return 'Passive';
  if (v <= 0.6) return 'Balanced';
  if (v <= 0.8) return 'Aggressive';
  return 'Very Aggressive';
}

function mkBlankExec() {
  const today = new Date();
  return {
    dataFrom:         '2022-03-01',
    dataTo:           today.toISOString().slice(0, 10),
    allowed_actions:  [...ALL_EXEC_ACTION_IDS] as number[],
    max_drawdown_limit: 0.20,
    aggression_level:   0.5,
    position_size_pct:  1.0,
    max_position_btc:   5.0,
    min_order_size:     0.1,
    expiry_days_min:    7,
    expiry_days_max:    7,
    roll_dte_threshold: 0,
    max_margin_ratio:   0.8,
    delta_threshold:    0.30,
    delta_penalty_coef: 0.002,
    risk_free_rate:     0.05,
    fast_margin:        false,
  };
}

function execFormFromSettings(s: ExecutionSettings, fallback: ReturnType<typeof mkBlankExec>): ReturnType<typeof mkBlankExec> {
  return {
    dataFrom:           (s.dataFrom           ?? fallback.dataFrom),
    dataTo:             (s.dataTo             ?? fallback.dataTo),
    allowed_actions:    (s.allowed_actions     ?? fallback.allowed_actions),
    max_drawdown_limit: (s.max_drawdown_limit  ?? fallback.max_drawdown_limit),
    aggression_level:   (s.aggression_level    ?? fallback.aggression_level),
    position_size_pct:  (s.position_size_pct   ?? fallback.position_size_pct),
    max_position_btc:   (s.max_position_btc    ?? fallback.max_position_btc),
    min_order_size:     (s.min_order_size       ?? fallback.min_order_size),
    expiry_days_min:    (s.expiry_days_min      ?? fallback.expiry_days_min),
    expiry_days_max:    (s.expiry_days_max      ?? fallback.expiry_days_max),
    roll_dte_threshold: (s.roll_dte_threshold   ?? fallback.roll_dte_threshold),
    max_margin_ratio:   (s.max_margin_ratio     ?? fallback.max_margin_ratio),
    delta_threshold:    (s.delta_threshold      ?? fallback.delta_threshold),
    delta_penalty_coef: (s.delta_penalty_coef   ?? fallback.delta_penalty_coef),
    risk_free_rate:     (s.risk_free_rate        ?? fallback.risk_free_rate),
    fast_margin:        (s.fast_margin           ?? fallback.fast_margin),
  };
}

ChartJS.register(
  LineController,
  BarController,
  DoughnutController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

// ─── helpers ─────────────────────────────────────────────────────────────────

function n(v: number | string | undefined | null, d = 4) {
  if (v == null || v === '') return '—';
  const num = typeof v === 'string' ? parseFloat(v) : v;
  return isNaN(num) ? '—' : num.toFixed(d);
}

function usd(v: number | null) {
  if (v == null) return '—';
  return '$' + v.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function pctStr(v: number) {
  return (v >= 0 ? '+' : '') + v.toFixed(2) + '%';
}

function clsColor(v: number) {
  return v > 0 ? 'text-success' : v < 0 ? 'text-error' : 'text-text-secondary';
}

function fmtDate(ts: string | number) {
  return new Date(ts).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function fmtShort(ts: string | number) {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: '2-digit',
  });
}

function instrOptType(instrument?: string | null): 'call' | 'put' | null {
  if (!instrument) return null;
  const s = instrument.split('-').pop()?.toUpperCase();
  return s === 'C' ? 'call' : s === 'P' ? 'put' : null;
}

function instrStrike(instrument?: string | null): number | null {
  if (!instrument) return null;
  const parts = instrument.split('-');
  if (parts.length < 4) return null;
  const k = Number(parts[parts.length - 2]);
  return isNaN(k) ? null : k;
}

const ACTION_BADGE: Record<string, { color: string; bg: string; label: string }> = {
  settlement_init:       { color: 'text-slate-500',  bg: 'bg-slate-100/60',  label: 'Init'     },
  settlement_unrealized: { color: 'text-sky-600',    bg: 'bg-sky-100/80',    label: 'Mark'     },
  settlement_expired:    { color: 'text-amber-600',  bg: 'bg-amber-100/80',  label: 'Expired'  },
  open:                  { color: 'text-success',    bg: 'bg-success/10',    label: 'Open'     },
  close:                 { color: 'text-error',      bg: 'bg-error/10',      label: 'Close'    },
  hold:                  { color: 'text-slate-400',  bg: 'bg-slate-100/40',  label: 'Hold'     },
};

const OPTION_CATEGORIES = [
  'Calls Opened',
  'Calls Closed',
  'Calls Expired',
  'Puts Opened',
  'Puts Closed',
  'Puts Expired',
] as const;

const OPTION_COLORS: Record<string, string> = {
  'Calls Opened':  '#22c55e',
  'Calls Closed':  '#15803d',
  'Calls Expired': '#86efac',
  'Puts Opened':   '#ef4444',
  'Puts Closed':   '#b91c1c',
  'Puts Expired':  '#fca5a5',
};

const OPTION_BADGE: Record<string, { color: string; bg: string }> = {
  'Calls Opened':  { color: 'text-green-600',     bg: 'bg-green-100/80'     },
  'Calls Closed':  { color: 'text-green-800',     bg: 'bg-green-200/80'     },
  'Calls Expired': { color: 'text-green-500',     bg: 'bg-green-50'         },
  'Puts Opened':   { color: 'text-red-600',       bg: 'bg-red-100/80'       },
  'Puts Closed':   { color: 'text-red-800',       bg: 'bg-red-200/80'       },
  'Puts Expired':  { color: 'text-red-400',       bg: 'bg-red-50'           },
};

function optionCategory(a: AgentAction): string | null {
  if (!a.instrument) return null;
  const parts = a.instrument.split('-');
  const optType = parts[parts.length - 1];
  if (optType !== 'C' && optType !== 'P') return null;
  const kind = optType === 'C' ? 'Calls' : 'Puts';
  if (a.actionType === 'open') return `${kind} Opened`;
  if (a.actionType === 'close') return `${kind} Closed`;
  if (a.actionType === 'settlement_expired') return `${kind} Expired`;
  return null;
}

// Events are stored with sequential millisecond timestamps by run_session.py,
// so a simple ascending sort is sufficient — no type-based secondary key needed.
function sortActions(raw: AgentAction[]): AgentAction[] {
  return [...raw].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

const COMMON_LINE = { pointRadius: 0, borderWidth: 1.5, tension: 0.3, spanGaps: true };

// ─── Chart canvas wrapper ─────────────────────────────────────────────────────

function ChartBox({ title, id, height = 200 }: { title: string; id: string; height?: number }) {
  return (
    <Card>
      <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-3">
        {title}
      </p>
      <div style={{ position: 'relative', width: '100%', height }}>
        <canvas id={id} />
      </div>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface RunDetail extends AgentRun {
  startedAt?: string;
  session?: { name: string; algorithm: string; hyperparams?: { env?: ExecutionSettings } } | null;
  actions?: AgentAction[];
}

export default function RunDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const runId = typeof id === 'string' ? id : null;

  const run = useDeribitFetch<RunDetail>(runId ? `/agent/runs/${runId}` : null);
  const actionsReq = useDeribitFetch<AgentAction[]>(
    runId ? `/agent/runs/${runId}/actions?limit=5000` : null
  );

  const chartsRef = useRef<Record<string, ChartJS>>({});
  const [chartsReady, setChartsReady] = useState(false);
  const [yearFilter, setYearFilter] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState('');
  const [logSearch, setLogSearch] = useState('');

  // Execution accordion
  const [showExec, setShowExec] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [execForm, setExecForm] = useState<ReturnType<typeof mkBlankExec>>(mkBlankExec);
  const [executing, setExecuting] = useState(false);
  const [actioning, setActioning] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const execFormLoaded = useRef(false);

  // Strategy chip helpers
  const isChipActive = (ids: number[]) => ids.every(id => execForm.allowed_actions.includes(id));
  const toggleChip = (ids: number[]) => {
    if (isChipActive(ids)) {
      setExecForm(f => ({ ...f, allowed_actions: f.allowed_actions.filter(id => !ids.includes(id)) }));
    } else {
      setExecForm(f => ({ ...f, allowed_actions: [...new Set([...f.allowed_actions, ...ids])] }));
    }
  };

  // Populate execForm from DB settings once run data is available
  useEffect(() => {
    if (!run.data || execFormLoaded.current) return;
    execFormLoaded.current = true;
    const stored = run.data.executionSettings;
    const sessionEnv = (run.data as any).session?.hyperparams?.env as ExecutionSettings | undefined;
    const source = stored && Object.keys(stored).length > 0 ? stored : sessionEnv;
    if (source) setExecForm(execFormFromSettings(source, mkBlankExec()));
  }, [run.data]);

  // Debounce-save execForm to DB
  const flushSettings = useCallback(async (form: ReturnType<typeof mkBlankExec>) => {
    if (!runId) return;
    await agentFetch(`/agent/runs/${runId}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(form),
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 1500);
  }, [runId]);

  const saveSettings = useCallback((form: ReturnType<typeof mkBlankExec>) => {
    if (!runId || !execFormLoaded.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      flushSettings(form).catch(() => {});
    }, 800);
  }, [runId, flushSettings]);

  useEffect(() => {
    if (!execFormLoaded.current) return;
    saveSettings(execForm);
  }, [execForm, saveSettings]);


  const executeRun = async () => {
    if (!runId) return;
    if (!execForm.allowed_actions.length) {
      const { toast } = await import('react-hot-toast');
      toast.error('Enable at least one action.');
      return;
    }
    setExecuting(true);
    try {
      // Cancel pending debounce and flush settings synchronously before execute
      // so the server always reads the latest form values from the DB.
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      await flushSettings(execForm);
      await agentFetch(`/agent/runs/${runId}/execute`, {
        method: 'POST',
        body: JSON.stringify({
          dataFrom: execForm.dataFrom || undefined,
          dataTo:   execForm.dataTo   || undefined,
        }),
      });
      const { toast } = await import('react-hot-toast');
      toast.success('Execution queued.');
    } catch (e) {
      const { toast } = await import('react-hot-toast');
      toast.error(e instanceof Error ? e.message : 'Execute failed.');
    } finally {
      setExecuting(false);
    }
  };

  const runControl = async (action: 'pause' | 'resume' | 'stop') => {
    if (!runId) return;
    setActioning(true);
    try {
      await agentFetch(`/agent/runs/${runId}/${action}`, { method: 'POST' });
      const { toast } = await import('react-hot-toast');
      toast.success(`Agent ${action === 'stop' ? 'stopped' : action === 'pause' ? 'paused' : 'resumed'}.`);
      run.refetch();
    } catch (e) {
      const { toast } = await import('react-hot-toast');
      toast.error(e instanceof Error ? e.message : `Failed to ${action}.`);
    } finally {
      setActioning(false);
    }
  };

  const destroyCharts = () => {
    Object.values(chartsRef.current).forEach(c => c.destroy());
    chartsRef.current = {};
  };

  useEffect(() => {
    if (!run.data || !actionsReq.data) return;
    const allActions = sortActions(actionsReq.data);
    const filtered = yearFilter
      ? allActions.filter(a => new Date(a.timestamp).getFullYear().toString() === yearFilter)
      : allActions;
    const opening = yearFilter
      ? Number(run.data.initialCapitalBtc) + allActions
          .filter(a => new Date(a.timestamp).getFullYear() < parseInt(yearFilter))
          .reduce((s, a) => s + (Number(a.pnlBtc) || 0), 0)
      : Number(run.data.initialCapitalBtc);
    const t = setTimeout(() => {
      destroyCharts();
      buildCharts(run.data!, filtered, opening);
      setChartsReady(true);
    }, 50);
    return () => clearTimeout(t);
  }, [run.data, actionsReq.data, yearFilter]);

  useEffect(() => () => destroyCharts(), []);

  function buildCharts(runData: RunDetail, actions: AgentAction[], openingBalance?: number) {
    const initCap = openingBalance ?? Number(runData.initialCapitalBtc);
    const labels = actions.map(a => fmtDate(a.timestamp));

    // Use stored equityBtc (computed by run_session.py) for precise P&L tracking against
    // openingBalance. Falls back to cumulative pnlBtc sum only for actions missing equityBtc.
    let cum = 0;
    const cumPnlBtc: (number | null)[] = actions.map(a => {
      if (a.equityBtc != null) return +(Number(a.equityBtc) - initCap).toFixed(6);
      cum += Number(a.pnlBtc) || 0;
      return +cum.toFixed(6);
    });
    const equityBtc = cumPnlBtc.map(c => c != null ? +(initCap + c).toFixed(6) : null);
    const btcPrice = actions.map(a => (a.btcPrice != null ? Number(a.btcPrice) : null));
    const equityUsd = equityBtc.map((e, i) =>
      e != null && btcPrice[i] != null ? +(e * btcPrice[i]!).toFixed(0) : null
    );
    const cumPnlUsd = cumPnlBtc.map((p, i) =>
      p != null && btcPrice[i] != null ? +(p * btcPrice[i]!).toFixed(0) : null
    );
    const rewardBar = actions.map(a => Number(a.pnlBtc) || 0);
    const ivData = actions.map(a => (a.ivRank != null ? Number(a.ivRank) : null));
    const deltaData = actions.map(a => (a.delta != null ? Number(a.delta) : null));

    const callStrike: (number | null)[] = [];
    const putStrike: (number | null)[] = [];
    // Track by instrument name so open/close are matched exactly.
    // Avoids false retentions when a close event has a null/mismatched instrument.
    const openPos = new Map<string, { strike: number; type: 'call' | 'put' }>();
    actions.forEach(a => {
      const t     = a.actionType;
      const instr = a.instrument ?? '';
      const opt   = instrOptType(a.instrument);
      const k     = instrStrike(a.instrument);
      if (t === 'open' && opt && k !== null) {
        openPos.set(instr, { strike: k, type: opt });
      } else if (t === 'close' || t === 'settlement_expired') {
        openPos.delete(instr);
      }
      let cK: number | null = null, pK: number | null = null;
      for (const pos of openPos.values()) {
        if (pos.type === 'call') cK = pos.strike;
        if (pos.type === 'put')  pK = pos.strike;
      }
      callStrike.push(cK);
      putStrike.push(pK);
    });

    const scales = (left: object, right?: object) => ({
      x: { ticks: { maxTicksLimit: 8, font: { size: 10 } }, grid: { color: '#ffffff10' } },
      y: {
        position: 'left' as const,
        ...left,
        grid: { color: '#ffffff10' },
        ticks: { font: { size: 10 }, ...(left as any).ticks },
      },
      ...(right
        ? {
            y2: {
              position: 'right' as const,
              ...right,
              grid: { drawOnChartArea: false },
              ticks: { font: { size: 10 }, ...(right as any).ticks },
            },
          }
        : {}),
    });

    function mk(id: string, cfg: ChartConfiguration) {
      const el = document.getElementById(id) as HTMLCanvasElement | null;
      if (!el) return;
      chartsRef.current[id] = new ChartJS(el, cfg);
    }

    // 1. Equity USD vs BTC Price
    mk('c-equity', {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            ...COMMON_LINE,
            label: 'Equity USD',
            data: equityUsd,
            borderColor: '#4e8ef7',
            backgroundColor: 'rgba(78,142,247,.12)',
            fill: true,
          },
          {
            ...COMMON_LINE,
            label: 'BTC Price',
            data: btcPrice,
            borderColor: '#e6952c',
            backgroundColor: 'transparent',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { labels: { font: { size: 11 }, color: '#9ca3af' } } },
        scales: scales({
          ticks: {
            callback: (v: any) =>
              '$' + Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 }),
          },
        }),
      },
    });

    // 2. BTC Price vs Strikes
    mk('c-strikes', {
      type: 'line',
      data: {
        labels,
        datasets: [
          { ...COMMON_LINE, label: 'BTC Price', data: btcPrice, borderColor: '#e6952c' },
          {
            ...COMMON_LINE,
            label: 'Call Strike',
            data: callStrike,
            borderColor: '#4e8ef7',
            stepped: true,
            spanGaps: false,
          },
          {
            ...COMMON_LINE,
            label: 'Put Strike',
            data: putStrike,
            borderColor: '#ef4444',
            stepped: true,
            spanGaps: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { labels: { font: { size: 11 }, color: '#9ca3af' } } },
        scales: scales({
          ticks: {
            callback: (v: any) =>
              '$' + Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 }),
          },
        }),
      },
    });

    // 3. P&L USD
    mk('c-pnlusd', {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            ...COMMON_LINE,
            label: 'P&L (USD)',
            data: cumPnlUsd,
            fill: { target: 'origin', above: 'rgba(26,127,55,.15)', below: 'rgba(207,34,46,.15)' },
            segment: { borderColor: (ctx: any) => (ctx.p0.parsed.y >= 0 ? '#1a7f37' : '#cf222e') },
            backgroundColor: 'transparent',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false } },
        scales: scales({ ticks: { callback: (v: any) => (v >= 0 ? '+' : '') + usd(v) } }),
      },
    });

    // 4. P&L BTC
    mk('c-pnlbtc', {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            ...COMMON_LINE,
            label: 'P&L (₿)',
            data: cumPnlBtc,
            fill: { target: 'origin', above: 'rgba(26,127,55,.15)', below: 'rgba(207,34,46,.15)' },
            segment: { borderColor: (ctx: any) => (ctx.p0.parsed.y >= 0 ? '#1a7f37' : '#cf222e') },
            backgroundColor: 'transparent',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false } },
        scales: scales({
          ticks: { callback: (v: any) => (v >= 0 ? '+' : '') + Number(v).toFixed(4) + '₿' },
        }),
      },
    });

    // 5b. Daily Reward
    mk('c-reward', {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Reward',
            data: rewardBar,
            backgroundColor: rewardBar.map(v =>
              v >= 0 ? 'rgba(26,127,55,.7)' : 'rgba(207,34,46,.7)'
            ),
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: scales({ ticks: { callback: (v: any) => Number(v).toFixed(4) } }),
      },
    });

    // 6. IV Rank & Delta
    mk('c-iv', {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            ...COMMON_LINE,
            label: 'IV Rank (DVOL)',
            data: ivData,
            yAxisID: 'y',
            borderColor: '#8b5cf6',
            backgroundColor: 'transparent',
          },
          {
            ...COMMON_LINE,
            label: 'Portfolio Delta',
            data: deltaData,
            yAxisID: 'y2',
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14,165,233,.08)',
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { labels: { font: { size: 11 }, color: '#9ca3af' } } },
        scales: scales(
          { title: { display: true, text: 'IV Rank', font: { size: 10 } } },
          { title: { display: true, text: 'Delta', font: { size: 10 } } }
        ),
      },
    });

  }

  // ── Derived stats ────────────────────────────────────────────────────────────
  const actions = actionsReq.data ? sortActions(actionsReq.data) : [];
  const runData = run.data;
  const initCap = runData ? Number(runData.initialCapitalBtc) : 0;

  // All years available from the full dataset (for tab list)
  const uniqueYears = Array.from(
    new Set(actions.map(a => new Date(a.timestamp).getFullYear().toString()))
  ).sort();

  // Accounting carry-over: opening balance = prior year(s) cumulative equity
  const openingBalance = yearFilter
    ? initCap + actions
        .filter(a => new Date(a.timestamp).getFullYear() < parseInt(yearFilter))
        .reduce((s, a) => s + (Number(a.pnlBtc) || 0), 0)
    : initCap;

  // All page content scoped to selected year
  const yearActions = yearFilter
    ? actions.filter(a => new Date(a.timestamp).getFullYear().toString() === yearFilter)
    : actions;

  // Only cash-flow events count as "trades" for stats
  const tradeActions = yearActions.filter(
    a => a.actionType === 'open' || a.actionType === 'close' || a.actionType === 'settlement_expired'
  );
  const tradePnls = tradeActions.map(a => Number(a.pnlBtc) || 0);
  const totalPnl = yearActions.reduce((s, a) => s + (Number(a.pnlBtc) || 0), 0);
  const wins = tradePnls.filter(v => v > 0).length;
  const winRate = tradeActions.length ? (wins / tradeActions.length) * 100 : 0;
  const best = tradePnls.length ? Math.max(...tradePnls) : 0;
  const worst = tradePnls.length ? Math.min(...tradePnls) : 0;
  const lastBtc = yearActions.length ? Number(yearActions[yearActions.length - 1].btcPrice) || 0 : 0;
  const finalEq = openingBalance + totalPnl;

  // option-type breakdown — net cash flow (cashflowBtc − feeBtc) per category
  const optionSummary: Record<string, { count: number; total: number }> = {};
  yearActions.forEach(a => {
    const cat = optionCategory(a);
    if (!cat) return;
    if (!optionSummary[cat]) optionSummary[cat] = { count: 0, total: 0 };
    optionSummary[cat].count++;
    optionSummary[cat].total += (Number(a.cashflowBtc) || 0) - (Number(a.feeBtc) || 0);
  });

  // equity and cashflowBtc are computed by run_session.py and stored in the DB as absolute
  // values — no offset needed. prevEpochLast seeds the synthetic Init row so it shows the
  // actual closing state of the prior epoch rather than the computed openingBalance.
  const prevEpochLast = (() => {
    if (!yearFilter) return null;
    const prev = actions.filter(
      a => new Date(a.timestamp).getFullYear() < parseInt(yearFilter) && a.actionType !== 'settlement_init'
    );
    if (!prev.length) return null;
    const last = prev[prev.length - 1];
    const equity = last.equityBtc != null
      ? Number(last.equityBtc)
      : (last.marginBalanceBtc != null ? Number(last.marginBalanceBtc) : null);
    const margin = last.marginBalanceBtc != null ? Number(last.marginBalanceBtc) : equity;
    return { equity, margin };
  })();

  const actionLog = (() => {
    return yearActions.map(a => {
      const marginBalance = a.marginBalanceBtc != null ? Number(a.marginBalanceBtc) : null;
      const equity = a.equityBtc != null ? Number(a.equityBtc) : (marginBalance ?? 0);
      const cumPnl = equity - openingBalance;
      return { ...a, equity, cumPnl, marginBalance };
    });
  })();

  const LOG_TYPE_TABS = [
    { label: 'Open',    value: 'open'                 },
    { label: 'Close',   value: 'close'                },
    { label: 'Mark',    value: 'settlement_unrealized' },
    { label: 'Expired', value: 'settlement_expired'   },
    { label: 'Hold',    value: 'hold'                 },
  ];

  // filtered log (newest first) — year already scoped via yearActions
  // settlement_init is always represented by the pinned opening-balance row, so exclude it here
  const filteredLog = [...actionLog].filter(a => {
    if (a.actionType === 'settlement_init') return false;
    if (logTypeFilter && a.actionType !== logTypeFilter) return false;
    if (logSearch) {
      const q = logSearch.toLowerCase();
      return a.actionType.includes(q) || fmtShort(a.timestamp).toLowerCase().includes(q);
    }
    return true;
  });

  const loading = run.loading || actionsReq.loading;
  const error = run.error || actionsReq.error;

  return (
    <>
      <Head>
        <title>Deribit Agent — Agent {runId?.slice(0, 8)}</title>
      </Head>

      <Section>
        <PageHeader
          title={runData?.name ?? 'Agent'}
          description={
            runData
              ? `${runData.currency} · ${runData.runType ?? 'PAPER'} · ${runData.status}`
              : 'Loading…'
          }
          icon={faRobot}
          actions={
            <button
              type="button"
              onClick={() => router.push('/deribit-agent/agents')}
              className="inline-flex items-center gap-2 bg-surface text-text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-80 transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3" />
              Back to Agents
            </button>
          }
        />

        {loading && (
          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="h-20 bg-card rounded-lg animate-pulse" />
              ))}
            </div>
            <div className="h-52 bg-card rounded-lg animate-pulse" />
            <div className="h-52 bg-card rounded-lg animate-pulse" />
          </div>
        )}

        {error && (
          <AgentError
            message={error}
            onRetry={() => {
              run.refetch();
              actionsReq.refetch();
            }}
          />
        )}

        {!loading && !error && runData && (
          <>
            {/* Run meta */}
            {runData.session && (
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <Badge
                  text={runData.status}
                  variant="custom"
                  customColor={RUN_STATUS_BADGE[runData.status].color}
                  customBgColor={RUN_STATUS_BADGE[runData.status].bg}
                />
                <span className="text-text-muted text-xs">
                  Model: <span className="text-text-primary">{runData.session.name}</span> (
                  {runData.session.algorithm})
                </span>
                {runData.startedAt && (
                  <span className="text-text-muted text-xs">
                    Started {new Date(runData.startedAt).toLocaleString()}
                  </span>
                )}
                <button
                  type="button"
                  title="Reload stats"
                  onClick={() => { run.refetch(); actionsReq.refetch(); }}
                  className="ml-auto p-1.5 rounded text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
                >
                  <FontAwesomeIcon icon={faRotateRight} className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Execution Settings accordion */}
            <Card className="mt-4">
              <button
                type="button"
                className="w-full flex items-center justify-between"
                onClick={() => setShowExec(v => !v)}
              >
                <span className="text-sm font-semibold text-text-primary">
                  Execution Settings
                  {settingsSaved && <span className="ml-2 text-xs text-success font-normal">Saved</span>}
                </span>
                <FontAwesomeIcon
                  icon={showExec ? faChevronUp : faChevronDown}
                  className="w-3.5 h-3.5 text-text-muted"
                />
              </button>

              {showExec && (
                <div className="mt-5 space-y-6">

                  {/* ── Date range ───────────────────────────────────────────── */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextInput
                      label="Data From"
                      type="date"
                      value={execForm.dataFrom}
                      onChange={v => setExecForm(f => ({ ...f, dataFrom: v }))}
                    />
                    <TextInput
                      label="Data To"
                      type="date"
                      value={execForm.dataTo}
                      onChange={v => setExecForm(f => ({ ...f, dataTo: v }))}
                    />
                  </div>

                  {/* ── Strategies ───────────────────────────────────────────── */}
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                      Open Strategies
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {EXEC_STRATEGY_CHIPS.map(chip => {
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
                            <span className="ml-1 text-text-muted font-normal">{chip.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ── Risk & aggression ────────────────────────────────────── */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SliderInput
                      label="Max Drawdown Limit"
                      value={execForm.max_drawdown_limit * 100}
                      onChange={v => setExecForm(f => ({ ...f, max_drawdown_limit: v / 100 }))}
                      min={5} max={50} step={5}
                      formatValue={v => `${v.toFixed(0)}%`}
                      minLabel="5% (tight)" maxLabel="50% (loose)"
                      hint="Stop trading when peak-to-trough equity loss exceeds this."
                    />
                    <SliderInput
                      label="Aggression Level"
                      value={execForm.aggression_level * 100}
                      onChange={v => setExecForm(f => ({ ...f, aggression_level: v / 100 }))}
                      min={0} max={100} step={10}
                      formatValue={v => aggressionLabel(v / 100)}
                      minLabel="Passive" maxLabel="Aggressive"
                      hint="Scales position size 30%–100% of configured max."
                    />
                  </div>

                  {/* ── Position sizing ──────────────────────────────────────── */}
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                      Position Sizing
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <SliderInput
                        label="Position Size %"
                        value={execForm.position_size_pct * 100}
                        onChange={v => setExecForm(f => ({ ...f, position_size_pct: v / 100 }))}
                        min={5} max={100} step={5}
                        formatValue={v => `${v.toFixed(0)}%`}
                        minLabel="5%" maxLabel="100%"
                        hint="Fraction of margin allocated per leg."
                      />
                      <TextInput
                        label="Max Position BTC"
                        placeholder="5.0"
                        value={String(execForm.max_position_btc)}
                        onChange={v => setExecForm(f => ({ ...f, max_position_btc: parseFloat(v) || f.max_position_btc }))}
                      />
                      <TextInput
                        label="Min Order Size BTC"
                        placeholder="0.1"
                        value={String(execForm.min_order_size)}
                        onChange={v => setExecForm(f => ({ ...f, min_order_size: parseFloat(v) || f.min_order_size }))}
                      />
                    </div>
                  </div>

                  {/* ── Options structure ────────────────────────────────────── */}
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                      Options Structure
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <TextInput
                        label="Min DTE"
                        value={String(execForm.expiry_days_min)}
                        onChange={v => setExecForm(f => ({ ...f, expiry_days_min: Math.max(1, parseInt(v) || 7) }))}
                      />
                      <TextInput
                        label="Max DTE"
                        value={String(execForm.expiry_days_max)}
                        onChange={v => setExecForm(f => ({ ...f, expiry_days_max: Math.max(f.expiry_days_min, parseInt(v) || 7) }))}
                      />
                      <SliderInput
                        label="Roll threshold (DTE)"
                        value={execForm.roll_dte_threshold}
                        onChange={v => setExecForm(f => ({ ...f, roll_dte_threshold: v }))}
                        min={0} max={7} step={1}
                        formatValue={v => v === 0 ? 'Hold' : `Roll ≤${v}d`}
                        minLabel="Hold" maxLabel="Roll early"
                        hint="Close positions early when DTE reaches this threshold."
                      />
                    </div>
                    <SliderInput
                      label="Max Margin Ratio"
                      value={execForm.max_margin_ratio * 100}
                      onChange={v => setExecForm(f => ({ ...f, max_margin_ratio: v / 100 }))}
                      min={50} max={95} step={5}
                      formatValue={v => `${v.toFixed(0)}%`}
                      minLabel="50%" maxLabel="95%"
                      hint="Max portfolio margin utilization before blocking new trades."
                    />
                  </div>

                  {/* ── Delta management ─────────────────────────────────────── */}
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                      Delta Management
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <SliderInput
                        label="Delta Threshold"
                        value={execForm.delta_threshold * 100}
                        onChange={v => setExecForm(f => ({ ...f, delta_threshold: v / 100 }))}
                        min={10} max={80} step={5}
                        formatValue={v => `${v.toFixed(0)}%`}
                        minLabel="10% (strict)" maxLabel="80% (loose)"
                        hint="Net delta overshoot allowed before penalty kicks in."
                      />
                      <TextInput
                        label="Delta Penalty Coef"
                        placeholder="0.002"
                        value={String(execForm.delta_penalty_coef)}
                        onChange={v => setExecForm(f => ({ ...f, delta_penalty_coef: parseFloat(v) || f.delta_penalty_coef }))}
                      />
                    </div>
                  </div>

                  {/* ── Advanced (collapsible) ───────────────────────────────── */}
                  <div>
                    <button
                      type="button"
                      className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider hover:text-text-primary transition-colors"
                      onClick={() => setShowAdvanced(v => !v)}
                    >
                      <FontAwesomeIcon icon={showAdvanced ? faChevronUp : faChevronDown} className="w-3 h-3" />
                      Advanced
                    </button>
                    {showAdvanced && (
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 pl-1">
                        <TextInput
                          label="Risk Free Rate"
                          placeholder="0.05"
                          value={String(execForm.risk_free_rate)}
                          onChange={v => setExecForm(f => ({ ...f, risk_free_rate: parseFloat(v) || f.risk_free_rate }))}
                        />
                        <div>
                          <p className="text-xs text-text-muted mb-2">Fast Margin</p>
                          <button
                            type="button"
                            onClick={() => setExecForm(f => ({ ...f, fast_margin: !f.fast_margin }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              execForm.fast_margin ? 'bg-brand' : 'bg-input-border'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              execForm.fast_margin ? 'translate-x-6' : 'translate-x-1'
                            }`} />
                          </button>
                          <p className="text-xs text-text-muted mt-1">
                            Skip IV shocks in margin calc — faster, less precise.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Action buttons ───────────────────────────────────────── */}
                  <div className="flex gap-3 flex-wrap pt-1 border-t border-surface">
                    <button
                      type="button"
                      disabled={executing}
                      onClick={executeRun}
                      className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 disabled:opacity-50 transition-colors"
                    >
                      <FontAwesomeIcon icon={faPlay} className="w-3 h-3" />
                      {executing ? 'Queuing…' : 'Execute'}
                    </button>
                    {runData.status === 'ACTIVE' && (
                      <button
                        type="button"
                        disabled={actioning}
                        onClick={() => runControl('pause')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-yellow-400/50 text-yellow-400 hover:bg-yellow-400/10 disabled:opacity-50 transition-colors"
                      >
                        <FontAwesomeIcon icon={faPause} className="w-3 h-3" />
                        Pause
                      </button>
                    )}
                    {runData.status === 'PAUSED' && (
                      <button
                        type="button"
                        disabled={actioning}
                        onClick={() => runControl('resume')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-success/50 text-success hover:bg-success/10 disabled:opacity-50 transition-colors"
                      >
                        <FontAwesomeIcon icon={faPlay} className="w-3 h-3" />
                        Resume
                      </button>
                    )}
                    {(runData.status === 'ACTIVE' || runData.status === 'PAUSED') && (
                      <button
                        type="button"
                        disabled={actioning}
                        onClick={() => runControl('stop')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-error/50 text-error hover:bg-error/10 disabled:opacity-50 transition-colors"
                      >
                        <FontAwesomeIcon icon={faStop} className="w-3 h-3" />
                        Stop
                      </button>
                    )}
                  </div>

                </div>
              )}
            </Card>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
              {[
                { label: 'Actions', value: actions.length, sub: `${tradeActions.length} trades` },
                {
                  label: 'Net PnL',
                  value: `${n(totalPnl)} ₿`,
                  sub: pctStr(initCap ? (totalPnl / initCap) * 100 : 0),
                  cls: clsColor(totalPnl),
                },
                {
                  label: 'Net PnL USD',
                  value: usd(totalPnl * lastBtc || null),
                  sub: 'at last BTC price',
                  cls: clsColor(totalPnl),
                },
                { label: 'Equity', value: `${n(finalEq, 4)} ₿`, cls: clsColor(totalPnl) },
                {
                  label: 'Win Rate',
                  value: `${winRate.toFixed(1)}%`,
                  sub: `${wins}/${tradeActions.length}`,
                },
                { label: 'Best Trade', value: `${n(best)} ₿`, cls: 'text-success' },
                { label: 'Worst Trade', value: `${n(worst)} ₿`, cls: 'text-error' },
                { label: yearFilter ? 'Begin Equity' : 'Capital', value: `${n(yearFilter ? openingBalance : initCap, 4)} ₿`, cls: '' },
              ].map(s => (
                <Card key={s.label} className="flex flex-col gap-1">
                  <span className="text-text-muted text-xs uppercase tracking-wide">{s.label}</span>
                  <span className={`text-xl font-bold ${s.cls ?? ''}`}>{s.value}</span>
                  {s.sub && <span className="text-text-muted text-xs">{s.sub}</span>}
                </Card>
              ))}
            </div>

            {/* Year filter tabs */}
            {uniqueYears.length > 1 && (
              <div className="mt-6 flex items-center gap-1 border-b border-surface pb-1">
                {['All', ...uniqueYears].map(y => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setYearFilter(y === 'All' ? '' : y)}
                    className={`px-3 py-1.5 rounded-t text-xs font-semibold transition-colors ${
                      (y === 'All' ? !yearFilter : yearFilter === y)
                        ? 'text-brand border-b-2 border-brand -mb-px'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}

            {/* Primary charts */}
            <div className="mt-6 space-y-4">
              <ChartBox id="c-equity" title="Equity (USD) vs BTC Price" height={220} />
              <ChartBox id="c-strikes" title="BTC Price vs Strikes" height={220} />
              <ChartBox id="c-pnlusd" title="P&L (USD)" height={200} />
              <ChartBox id="c-pnlbtc" title="P&L (₿)" height={200} />
              <ChartBox id="c-reward" title="Daily Reward" height={180} />
              <ChartBox id="c-iv" title="IV Rank & Portfolio Delta" height={200} />
            </div>

            {/* Option breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Card>
                <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-4">
                  Option Breakdown
                </p>
                {(() => {
                  const s = optionSummary;
                  const callsTotal = (s['Calls Opened']?.count ?? 0) + (s['Calls Closed']?.count ?? 0) + (s['Calls Expired']?.count ?? 0);
                  const putsTotal  = (s['Puts Opened']?.count  ?? 0) + (s['Puts Closed']?.count  ?? 0) + (s['Puts Expired']?.count  ?? 0);
                  const callsExpired = s['Calls Expired']?.count ?? 0;
                  const callsClosed  = s['Calls Closed']?.count  ?? 0;
                  const putsExpired  = s['Puts Expired']?.count  ?? 0;
                  const putsClosed   = s['Puts Closed']?.count   ?? 0;

                  function CompareBar({
                    labelA, countA, colorA,
                    labelB, countB, colorB,
                  }: {
                    labelA: string; countA: number; colorA: string;
                    labelB: string; countB: number; colorB: string;
                  }) {
                    const total = countA + countB;
                    const pctA = total ? (countA / total) * 100 : 50;
                    const pctB = 100 - pctA;
                    return (
                      <div className="mb-4 last:mb-0">
                        <div className="flex justify-between text-xs text-text-muted mb-1.5">
                          <span>
                            <span className="font-semibold text-text-primary">{labelA}</span>
                            <span className="ml-1.5 font-mono">{countA}</span>
                          </span>
                          <span className="text-text-muted font-mono">total {total}</span>
                          <span>
                            <span className="font-mono mr-1.5">{countB}</span>
                            <span className="font-semibold text-text-primary">{labelB}</span>
                          </span>
                        </div>
                        <div className="flex h-5 rounded-full overflow-hidden">
                          <div style={{ width: `${pctA}%`, backgroundColor: colorA }} className="transition-all duration-500" />
                          <div style={{ width: `${pctB}%`, backgroundColor: colorB }} className="transition-all duration-500" />
                        </div>
                        <div className="flex justify-between text-[10px] text-text-muted mt-1 font-mono">
                          <span>{pctA.toFixed(0)}%</span>
                          <span>{pctB.toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <>
                      <CompareBar
                        labelA="Calls" countA={callsTotal} colorA={OPTION_COLORS['Calls Opened']}
                        labelB="Puts"  countB={putsTotal}  colorB={OPTION_COLORS['Puts Opened']}
                      />
                      <CompareBar
                        labelA="Calls Expired" countA={callsExpired} colorA={OPTION_COLORS['Calls Expired']}
                        labelB="Calls Closed"  countB={callsClosed}  colorB={OPTION_COLORS['Calls Closed']}
                      />
                      <CompareBar
                        labelA="Puts Expired" countA={putsExpired} colorA={OPTION_COLORS['Puts Expired']}
                        labelB="Puts Closed"  countB={putsClosed}  colorB={OPTION_COLORS['Puts Closed']}
                      />
                    </>
                  );
                })()}
              </Card>
              <Card>
                <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-3">
                  By Option Type
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface">
                      <th className="text-left text-text-muted font-medium py-2">Category</th>
                      <th className="text-right text-text-muted font-medium py-2">Count</th>
                      <th className="text-right text-text-muted font-medium py-2">Net CF (₿)</th>
                      <th className="text-right text-text-muted font-medium py-2">Avg (₿)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...OPTION_CATEGORIES].sort((a, b) => (optionSummary[b]?.count ?? 0) - (optionSummary[a]?.count ?? 0)).map(cat => {
                      const s = optionSummary[cat] ?? { count: 0, total: 0 };
                      const avg = s.count ? s.total / s.count : 0;
                      const style = OPTION_BADGE[cat];
                      return (
                        <tr key={cat} className="border-b border-surface/50">
                          <td className="py-2">
                            <Badge
                              text={cat}
                              variant="custom"
                              customColor={style.color}
                              customBgColor={style.bg}
                            />
                          </td>
                          <td className="text-right text-text-primary font-mono">{s.count}</td>
                          <td className={`text-right font-mono ${clsColor(s.total)}`}>
                            {n(s.total)}
                          </td>
                          <td className={`text-right font-mono ${clsColor(avg)}`}>{n(avg)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            </div>

            {/* Action log */}
            <Card className="mt-4 p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-surface space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">
                    Action Log
                    <span className="text-text-muted font-normal ml-1.5">
                      {filteredLog.length !== actionLog.length
                        ? `${filteredLog.length} / ${actionLog.length}`
                        : actionLog.length}
                    </span>
                  </p>
                  <input
                    type="text"
                    placeholder="Search…"
                    value={logSearch}
                    onChange={e => setLogSearch(e.target.value)}
                    className="bg-surface border border-input-border hover:border-brand focus:border-brand rounded-lg px-3 py-1.5 text-xs text-text-primary outline-none w-40 transition-colors"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[{ label: 'All', value: '' }, ...LOG_TYPE_TABS].map(t => (
                    <button
                      key={t.value || 'all'}
                      type="button"
                      onClick={() => setLogTypeFilter(t.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        logTypeFilter === t.value
                          ? 'bg-brand text-white'
                          : 'bg-surface text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                <table className="w-full text-xs min-w-[900px]">
                  <thead className="sticky top-0 z-10 bg-card">
                    <tr className="border-b-2 border-surface">
                      {(
                        [
                          ['Date',         'text-left'],
                          ['Type',         'text-left'],
                          ['Size',         'text-right'],
                          ['Instrument',   'text-left'],
                          ['BTC Price',    'text-right'],
                          ['IV',           'text-right'],
                          ['Δ',            'text-right'],
                          ['Θ/day',        'text-right'],
                          ['Orig Prem',    'text-right'],
                          ['Mkt Prem',     'text-right'],
                          ['Cashflow',     'text-right'],
                          ['Fee (₿)',      'text-right'],
                          ['PnL (₿)',      'text-right'],
                          ['Cum PnL (₿)', 'text-right'],
                          ['Margin (₿)',  'text-right'],
                          ['Equity (₿)',  'text-right'],
                        ] as const
                      ).map(([h, align]) => (
                        <th key={h} className={`px-3 py-2 font-medium text-text-muted whitespace-nowrap ${align}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Pinned opening-balance row — always shown regardless of filters */}
                    {(() => {
                      const initTs = yearActions.find(a => a.actionType === 'settlement_init')?.timestamp
                        ?? yearActions[0]?.timestamp;
                      const badge = ACTION_BADGE['settlement_init'];
                      const dash = <span className="text-text-muted">—</span>;
                      return (
                        <tr className="bg-surface/30">
                          <td className="px-3 py-1.5 text-text-muted whitespace-nowrap">{initTs ? fmtShort(initTs) : '—'}</td>
                          <td className="px-3 py-1.5"><Badge text={badge.label} variant="custom" customColor={badge.color} customBgColor={badge.bg} /></td>
                          <td className="px-3 py-1.5 text-right">{dash}</td>
                          <td className="px-3 py-1.5">{dash}</td>
                          <td className="px-3 py-1.5 text-right">{dash}</td>
                          <td className="px-3 py-1.5 text-right">{dash}</td>
                          <td className="px-3 py-1.5 text-right">{dash}</td>
                          <td className="px-3 py-1.5 text-right">{dash}</td>
                          <td className="px-3 py-1.5 text-right">{dash}</td>
                          <td className="px-3 py-1.5 text-right">{dash}</td>
                          <td className="px-3 py-1.5 text-right">{dash}</td>
                          <td className="px-3 py-1.5 text-right">{dash}</td>
                          <td className="px-3 py-1.5 text-right">{dash}</td>
                          <td className="px-3 py-1.5 text-right font-mono text-text-muted">{n(0)}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{n(prevEpochLast?.margin ?? openingBalance, 4)}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{n(prevEpochLast?.equity ?? openingBalance, 4)}</td>
                        </tr>
                      );
                    })()}
                    {filteredLog.map((a, i) => {
                      const btcP  = a.btcPrice != null ? Number(a.btcPrice) : null;
                      const style = ACTION_BADGE[a.actionType] ?? { color: 'text-text-secondary', bg: 'bg-surface', label: a.actionType };
                      const opt   = instrOptType(a.instrument);
                      const k     = instrStrike(a.instrument);
                      const itm   = opt === 'call'
                        ? (btcP != null && k != null && k < btcP)
                        : opt === 'put'
                          ? (btcP != null && k != null && k > btcP)
                          : false;

                      // executedPrice is always the original premium (set by run_session for all types).
                      // price is the current mark/intrinsic/buyback depending on event type.
                      // At open, both are equal (just sold at market → unrealized = 0).
                      const origPrem = a.executedPrice;
                      const mktPrem  = a.price;

                      // For unrealized marks pnlBtc is null — derive display PnL from size × (orig − mkt).
                      const unrealPnl =
                        a.pnlBtc == null && origPrem != null && mktPrem != null && a.quantity != null
                          ? Number(a.quantity) * (Number(origPrem) - Number(mktPrem))
                          : null;
                      const displayPnl = a.pnlBtc ?? unrealPnl;

                      return (
                        <tr key={a.id ?? i} className={i % 2 === 0 ? '' : 'bg-surface/20'}>
                          {/* Date */}
                          <td className="px-3 py-1.5 text-text-muted whitespace-nowrap">
                            {fmtShort(a.timestamp)}
                          </td>
                          {/* Type */}
                          <td className="px-3 py-1.5">
                            <Badge text={style.label} variant="custom" customColor={style.color} customBgColor={style.bg} />
                          </td>
                          {/* Size */}
                          <td className="px-3 py-1.5 text-right font-mono text-text-primary">
                            {a.quantity != null ? Number(a.quantity).toFixed(2) : '—'}
                          </td>
                          {/* Instrument */}
                          <td className={`px-3 py-1.5 font-mono whitespace-nowrap ${itm ? 'text-error font-semibold' : 'text-text-primary'}`}>
                            {a.instrument ?? '—'}
                          </td>
                          {/* BTC Price */}
                          <td className="px-3 py-1.5 text-right text-text-primary font-mono">
                            {btcP ? '$' + btcP.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'}
                          </td>
                          {/* IV */}
                          <td className="px-3 py-1.5 text-right">
                            {a.ivRank != null ? Number(a.ivRank).toFixed(1) : '—'}
                          </td>
                          {/* Delta */}
                          <td className="px-3 py-1.5 text-right">
                            {a.delta != null ? Number(a.delta).toFixed(3) : '—'}
                          </td>
                          {/* Theta/day (negative = option decays; shown as-is) */}
                          <td className="px-3 py-1.5 text-right font-mono text-text-muted">
                            {a.thetaBtc != null ? n(a.thetaBtc, 6) : '—'}
                          </td>
                          {/* Orig Prem */}
                          <td className="px-3 py-1.5 text-right font-mono text-text-secondary">
                            {origPrem != null ? n(origPrem, 6) : '—'}
                          </td>
                          {/* Mkt Prem */}
                          <td className="px-3 py-1.5 text-right font-mono text-text-muted">
                            {mktPrem != null ? n(mktPrem, 6) : '—'}
                          </td>
                          {/* Cashflow: actual BTC in (+) or out (−), stored by run_session */}
                          <td className={`px-3 py-1.5 text-right font-mono ${a.cashflowBtc != null ? clsColor(Number(a.cashflowBtc)) : 'text-text-muted'}`}>
                            {a.cashflowBtc != null ? n(a.cashflowBtc) : '—'}
                          </td>
                          {/* Fee — shown as negative (it's a cost) */}
                          <td className="px-3 py-1.5 text-right font-mono text-error">
                            {a.feeBtc != null && Number(a.feeBtc) !== 0
                              ? '-' + n(Math.abs(Number(a.feeBtc)), 6)
                              : '—'}
                          </td>
                          {/* PnL */}
                          <td className={`px-3 py-1.5 text-right font-mono ${displayPnl != null ? clsColor(Number(displayPnl)) : 'text-text-muted'}`}>
                            {displayPnl != null ? n(displayPnl) : '—'}
                          </td>
                          {/* Cum PnL */}
                          <td className={`px-3 py-1.5 text-right font-mono ${clsColor(a.cumPnl)}`}>
                            {n(a.cumPnl)}
                          </td>
                          {/* Margin */}
                          <td className="px-3 py-1.5 text-right font-mono">
                            {a.marginBalance != null ? n(a.marginBalance, 4) : '—'}
                          </td>
                          {/* Equity */}
                          <td className="px-3 py-1.5 text-right font-mono">
                            {n(a.equity, 4)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </Section>
    </>
  );
}
