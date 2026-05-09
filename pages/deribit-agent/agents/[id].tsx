import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
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
} from '@fortawesome/free-solid-svg-icons';
import { Section, PageHeader } from '@/components/ui/Layout';
import Card from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AgentError } from '@/components/features/DeribitAgent/AgentError';
import TextInput from '@/components/ui/Input/TextInput';
import SliderInput from '@/components/ui/Input/SliderInput';
import { useDeribitFetch, agentFetch, type AgentRun, type AgentAction } from '@/lib/deribit-agent/client';
import { RUN_STATUS_BADGE } from '@/lib/deribit-agent/ui';

const EXEC_STRATEGY_OPTIONS = [
  { value: 'short_call', label: 'Short Call', desc: 'Sell calls Δ20–Δ80' },
  { value: 'short_put', label: 'Short Put', desc: 'Sell puts Δ10–Δ50' },
  { value: 'delta_neutral', label: 'Delta Neutral', desc: 'Balanced call + put' },
];

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
    dataFrom:          '2022-03-01',
    dataTo:            today.toISOString().slice(0, 10),
    allowedStrategies: ['short_call', 'short_put', 'delta_neutral'] as string[],
    maxDrawdownLimit:  0.20,
    aggressionLevel:   0.5,
    positionSizePct:   1.0,
    maxPositionBtc:    5.0,
    minOrderSize:      0.1,
    expiryDays:        7,
    maxMarginRatio:    0.8,
    deltaThreshold:    0.30,
    deltaPenaltyCoef:  0.002,
    riskFreeRate:      0.05,
    fastMargin:        false,
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

function sizedInstrument(
  instrument: string,
  qty: number | null | undefined,
  actionType: string
): string {
  if (qty == null) return instrument;
  const sign = actionType.startsWith('sell_') ? -1 : 1;
  const sized = (sign * Number(qty)).toFixed(1);
  return `${sized} ${instrument}`;
}

function parseLegs(instrument?: string | null) {
  const empty = {
    call: null as number | null, put: null as number | null,
    callInstrument: null as string | null, putInstrument: null as string | null,
    callSize: null as number | null, putSize: null as number | null,
  };
  if (!instrument) return empty;
  let call: number | null = null, put: number | null = null;
  let callInstrument: string | null = null, putInstrument: string | null = null;
  let callSize: number | null = null, putSize: number | null = null;
  instrument.split('|').forEach(leg => {
    // Support size-prefixed format: "0.4:BTC-07FEB25-105000-C"
    let name = leg, size: number | null = null;
    const colon = leg.indexOf(':');
    if (colon > 0) {
      const s = parseFloat(leg.slice(0, colon));
      if (!isNaN(s)) { size = s; name = leg.slice(colon + 1); }
    }
    const p = name.split('-');
    if (p.length < 4) return;
    const k = Number(p[2]), t = p[3].toUpperCase();
    if (t === 'C') { call = k; callInstrument = name; callSize = size; }
    else if (t === 'P') { put = k; putInstrument = name; putSize = size; }
  });
  return { call, put, callInstrument, putInstrument, callSize, putSize };
}

const ACTION_COLORS: Record<string, string> = {
  sell_call: '#e6952c',
  sell_put: '#0ea5e9',
  sell_strangle: '#8b5cf6',
  close: '#ef4444',
  hold: '#94a3b8',
  buy_call: '#22c55e',
  buy_put: '#f43f5e',
  hedge: '#f59e0b',
};

const ACTION_BADGE: Record<string, { color: string; bg: string }> = {
  sell_call: { color: 'text-yellow-600', bg: 'bg-yellow-100/80' },
  sell_put: { color: 'text-sky-600', bg: 'bg-sky-100/80' },
  sell_strangle: { color: 'text-purple-600', bg: 'bg-purple-100/80' },
  close: { color: 'text-error', bg: 'bg-error/10' },
  hold: { color: 'text-text-muted', bg: 'bg-surface' },
  buy_call: { color: 'text-success', bg: 'bg-success/10' },
  buy_put: { color: 'text-rose-500', bg: 'bg-rose-100/80' },
  hedge: { color: 'text-yellow-500', bg: 'bg-yellow-400/10' },
};

const COMMON_LINE = { pointRadius: 0, borderWidth: 1.5, tension: 0.3 };

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
  session?: { name: string; algorithm: string } | null;
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
  const [execForm, setExecForm] = useState<ReturnType<typeof mkBlankExec>>(() => {
    if (typeof window === 'undefined') return mkBlankExec();
    try {
      const saved = localStorage.getItem('deribit:exec-settings');
      if (saved) return { ...mkBlankExec(), ...JSON.parse(saved) };
    } catch {}
    return mkBlankExec();
  });
  const [executing, setExecuting] = useState(false);
  const [actioning, setActioning] = useState(false);

  const toggleExecStrategy = (s: string) => {
    setExecForm(f => ({
      ...f,
      allowedStrategies: f.allowedStrategies.includes(s)
        ? f.allowedStrategies.filter(x => x !== s)
        : [...f.allowedStrategies, s],
    }));
  };

  const executeRun = async () => {
    if (!runId) return;
    if (!execForm.allowedStrategies.length) {
      const { toast } = await import('react-hot-toast');
      toast.error('Enable at least one strategy.');
      return;
    }
    setExecuting(true);
    try {
      await agentFetch(`/agent/runs/${runId}/execute`, {
        method: 'POST',
        body: JSON.stringify({
          dataFrom: execForm.dataFrom || undefined,
          dataTo: execForm.dataTo || undefined,
          envOverrides: {
            allowed_actions:       execForm.allowedStrategies,
            randomize_conditioning: false,
            max_drawdown_limit:    execForm.maxDrawdownLimit,
            aggression_level:      execForm.aggressionLevel,
            position_size_pct:     execForm.positionSizePct,
            max_position_btc:      execForm.maxPositionBtc,
            min_order_size:        execForm.minOrderSize,
            expiry_days:           execForm.expiryDays,
            max_margin_ratio:      execForm.maxMarginRatio,
            delta_threshold:       execForm.deltaThreshold,
            delta_penalty_coef:    execForm.deltaPenaltyCoef,
            risk_free_rate:        execForm.riskFreeRate,
            fast_margin:           execForm.fastMargin,
          },
        }),
      });
      const { toast } = await import('react-hot-toast');
      toast.success('Execution queued.');
      run.refetch();
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
    try { localStorage.setItem('deribit:exec-settings', JSON.stringify(execForm)); } catch {}
  }, [execForm]);

  useEffect(() => {
    if (!run.data || !actionsReq.data) return;
    const allActions = [...actionsReq.data].reverse();
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

    let cum = 0;
    const cumPnlBtc = actions.map(a => {
      cum += Number(a.pnlBtc) || 0;
      return +cum.toFixed(6);
    });
    const equityBtc = cumPnlBtc.map(c => +(initCap + c).toFixed(6));
    const btcPrice = actions.map(a => (a.btcPrice != null ? Number(a.btcPrice) : null));
    const equityUsd = equityBtc.map((e, i) =>
      btcPrice[i] != null ? +(e * btcPrice[i]!).toFixed(0) : null
    );
    const cumPnlUsd = cumPnlBtc.map((p, i) =>
      btcPrice[i] != null ? +(p * btcPrice[i]!).toFixed(0) : null
    );
    const rewardBar = actions.map(a => Number(a.pnlBtc) || 0);
    const ivData = actions.map(a => (a.ivRank != null ? Number(a.ivRank) : null));
    const deltaData = actions.map(a => (a.delta != null ? Number(a.delta) : null));

    const callStrike: (number | null)[] = [];
    const putStrike: (number | null)[] = [];
    let cK: number | null = null,
      pK: number | null = null;
    actions.forEach(a => {
      const t = a.actionType,
        legs = parseLegs(a.instrument);
      if (t === 'sell_call') {
        cK = legs.call;
      } else if (t === 'sell_put') {
        pK = legs.put;
      } else if (t === 'sell_strangle') {
        if (legs.call != null) cK = legs.call;
        if (legs.put != null) pK = legs.put;
      } else if (t === 'close') {
        cK = null;
        pK = null;
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
          },
          {
            ...COMMON_LINE,
            label: 'Put Strike',
            data: putStrike,
            borderColor: '#ef4444',
            stepped: true,
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

    // 7. Doughnut
    const typeCnt: Record<string, number> = {};
    actions.forEach(a => {
      typeCnt[a.actionType] = (typeCnt[a.actionType] || 0) + 1;
    });
    const pieL = Object.keys(typeCnt);
    const el7 = document.getElementById('c-pie') as HTMLCanvasElement | null;
    if (el7) {
      chartsRef.current['c-pie'] = new ChartJS<'doughnut'>(el7, {
        type: 'doughnut',
        data: {
          labels: pieL,
          datasets: [
            {
              data: pieL.map(k => typeCnt[k]),
              backgroundColor: pieL.map(k => ACTION_COLORS[k] || '#94a3b8'),
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '60%',
          plugins: {
            legend: {
              position: 'right',
              labels: { font: { size: 11 }, color: '#9ca3af', padding: 10 },
            },
          },
        },
      });
    }
  }

  // ── Derived stats ────────────────────────────────────────────────────────────
  const actions = actionsReq.data ? [...actionsReq.data].reverse() : [];
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

  const tradeActions = yearActions.filter(a => a.actionType !== 'hold');
  const tradePnls = tradeActions.map(a => Number(a.pnlBtc) || 0);
  const totalPnl = yearActions.reduce((s, a) => s + (Number(a.pnlBtc) || 0), 0);
  const wins = tradePnls.filter(v => v > 0).length;
  const winRate = tradeActions.length ? (wins / tradeActions.length) * 100 : 0;
  const best = tradePnls.length ? Math.max(...tradePnls) : 0;
  const worst = tradePnls.length ? Math.min(...tradePnls) : 0;
  const lastBtc = yearActions.length ? Number(yearActions[yearActions.length - 1].btcPrice) || 0 : 0;
  const finalEq = openingBalance + totalPnl;

  // type breakdown
  const typeSummary: Record<string, { count: number; total: number }> = {};
  yearActions.forEach(a => {
    if (!typeSummary[a.actionType]) typeSummary[a.actionType] = { count: 0, total: 0 };
    typeSummary[a.actionType].count++;
    typeSummary[a.actionType].total += Number(a.pnlBtc) || 0;
  });

  // cumulative pnl + running open-position state for the log table
  const actionLog = (() => {
    let c = 0;
    let openPut: string | null = null;
    let openCall: string | null = null;
    let openPutSize: number | null = null;
    let openCallSize: number | null = null;
    let openPutStrike: number | null = null;
    let openCallStrike: number | null = null;

    return yearActions.map(a => {
      c += Number(a.pnlBtc) || 0;
      const legs = parseLegs(a.instrument);
      const qty = a.quantity != null ? Number(a.quantity) : null;
      const t = a.actionType;

      if (t === 'sell_put') {
        openPut = legs.putInstrument;
        openPutStrike = legs.put;
        openPutSize = -(legs.putSize ?? qty ?? 0);
      } else if (t === 'sell_call') {
        openCall = legs.callInstrument;
        openCallStrike = legs.call;
        openCallSize = -(legs.callSize ?? qty ?? 0);
      } else if (t === 'sell_strangle') {
        openPut = legs.putInstrument;
        openCall = legs.callInstrument;
        openPutStrike = legs.put;
        openCallStrike = legs.call;
        openPutSize = -(legs.putSize ?? qty ?? 0);
        openCallSize = -(legs.callSize ?? qty ?? 0);
      } else if (t === 'close' || t.startsWith('close_')) {
        openPut = null; openCall = null;
        openPutSize = null; openCallSize = null;
        openPutStrike = null; openCallStrike = null;
      }

      return {
        ...a, cumPnl: c, equity: openingBalance + c,
        openPut, openCall, openPutSize, openCallSize, openPutStrike, openCallStrike,
      };
    });
  })();

  // unique action types within selected year
  const uniqueTypes = Array.from(new Set(yearActions.map(a => a.actionType)));

  // filtered log (newest first) — year already scoped via yearActions
  const filteredLog = [...actionLog].filter(a => {
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
              </div>
            )}

            {/* Execution Settings accordion */}
            <Card className="mt-4">
              <button
                type="button"
                className="w-full flex items-center justify-between"
                onClick={() => setShowExec(v => !v)}
              >
                <span className="text-sm font-semibold text-text-primary">Execution Settings</span>
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
                      Strategies
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {EXEC_STRATEGY_OPTIONS.map(s => {
                        const active = execForm.allowedStrategies.includes(s.value);
                        return (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => toggleExecStrategy(s.value)}
                            className={`text-left px-3 py-2.5 rounded-lg border-2 transition-colors ${
                              active
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

                  {/* ── Risk & aggression ────────────────────────────────────── */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SliderInput
                      label="Max Drawdown Limit"
                      value={execForm.maxDrawdownLimit * 100}
                      onChange={v => setExecForm(f => ({ ...f, maxDrawdownLimit: v / 100 }))}
                      min={5} max={50} step={5}
                      formatValue={v => `${v.toFixed(0)}%`}
                      minLabel="5% (tight)" maxLabel="50% (loose)"
                      hint="Stop trading when peak-to-trough equity loss exceeds this."
                    />
                    <SliderInput
                      label="Aggression Level"
                      value={execForm.aggressionLevel * 100}
                      onChange={v => setExecForm(f => ({ ...f, aggressionLevel: v / 100 }))}
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
                        value={execForm.positionSizePct * 100}
                        onChange={v => setExecForm(f => ({ ...f, positionSizePct: v / 100 }))}
                        min={5} max={100} step={5}
                        formatValue={v => `${v.toFixed(0)}%`}
                        minLabel="5%" maxLabel="100%"
                        hint="Fraction of margin allocated per leg."
                      />
                      <TextInput
                        label="Max Position BTC"
                        placeholder="5.0"
                        value={String(execForm.maxPositionBtc)}
                        onChange={v => setExecForm(f => ({ ...f, maxPositionBtc: parseFloat(v) || f.maxPositionBtc }))}
                      />
                      <TextInput
                        label="Min Order Size BTC"
                        placeholder="0.1"
                        value={String(execForm.minOrderSize)}
                        onChange={v => setExecForm(f => ({ ...f, minOrderSize: parseFloat(v) || f.minOrderSize }))}
                      />
                    </div>
                  </div>

                  {/* ── Options structure ────────────────────────────────────── */}
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                      Options Structure
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs text-text-muted mb-2">Expiry (DTE)</p>
                        <div className="flex gap-2">
                          {[7, 14, 21, 30].map(d => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setExecForm(f => ({ ...f, expiryDays: d }))}
                              className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                                execForm.expiryDays === d
                                  ? 'border-brand bg-brand/5 text-brand'
                                  : 'border-input-border text-text-secondary hover:border-brand/50'
                              }`}
                            >
                              {d}d
                            </button>
                          ))}
                        </div>
                      </div>
                      <SliderInput
                        label="Max Margin Ratio"
                        value={execForm.maxMarginRatio * 100}
                        onChange={v => setExecForm(f => ({ ...f, maxMarginRatio: v / 100 }))}
                        min={50} max={95} step={5}
                        formatValue={v => `${v.toFixed(0)}%`}
                        minLabel="50%" maxLabel="95%"
                        hint="Max portfolio margin utilization before blocking new trades."
                      />
                    </div>
                  </div>

                  {/* ── Delta management ─────────────────────────────────────── */}
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                      Delta Management
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <SliderInput
                        label="Delta Threshold"
                        value={execForm.deltaThreshold * 100}
                        onChange={v => setExecForm(f => ({ ...f, deltaThreshold: v / 100 }))}
                        min={10} max={80} step={5}
                        formatValue={v => `${v.toFixed(0)}%`}
                        minLabel="10% (strict)" maxLabel="80% (loose)"
                        hint="Net delta overshoot allowed before penalty kicks in."
                      />
                      <TextInput
                        label="Delta Penalty Coef"
                        placeholder="0.002"
                        value={String(execForm.deltaPenaltyCoef)}
                        onChange={v => setExecForm(f => ({ ...f, deltaPenaltyCoef: parseFloat(v) || f.deltaPenaltyCoef }))}
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
                          value={String(execForm.riskFreeRate)}
                          onChange={v => setExecForm(f => ({ ...f, riskFreeRate: parseFloat(v) || f.riskFreeRate }))}
                        />
                        <div>
                          <p className="text-xs text-text-muted mb-2">Fast Margin</p>
                          <button
                            type="button"
                            onClick={() => setExecForm(f => ({ ...f, fastMargin: !f.fastMargin }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              execForm.fastMargin ? 'bg-brand' : 'bg-input-border'
                            }`}
                          >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              execForm.fastMargin ? 'translate-x-6' : 'translate-x-1'
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

            {/* Action breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <ChartBox id="c-pie" title="Action Breakdown" height={200} />
              <Card>
                <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-3">
                  By Action Type
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-surface">
                      <th className="text-left text-text-muted font-medium py-2">Type</th>
                      <th className="text-right text-text-muted font-medium py-2">Count</th>
                      <th className="text-right text-text-muted font-medium py-2">Total (₿)</th>
                      <th className="text-right text-text-muted font-medium py-2">Avg (₿)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(typeSummary)
                      .sort((a, b) => b[1].count - a[1].count)
                      .map(([type, s]) => {
                        const avg = s.total / s.count;
                        const style = ACTION_BADGE[type] ?? {
                          color: 'text-text-secondary',
                          bg: 'bg-surface',
                        };
                        return (
                          <tr key={type} className="border-b border-surface/50">
                            <td className="py-2">
                              <Badge
                                text={type}
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
                  {['All', ...uniqueTypes].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setLogTypeFilter(t === 'All' ? '' : t)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        (t === 'All' ? !logTypeFilter : logTypeFilter === t)
                          ? 'bg-brand text-white'
                          : 'bg-surface text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                <table className="w-full text-xs min-w-[760px]">
                  <thead className="sticky top-0 z-10 bg-card">
                    <tr className="border-b-2 border-surface">
                      {(
                        [
                          ['Date', 'text-left'],
                          ['Action', 'text-left'],
                          ['Put', 'text-left'],
                          ['BTC Price', 'text-right'],
                          ['Call', 'text-left'],
                          ['IV Rank', 'text-right'],
                          ['Delta', 'text-right'],
                          ['PnL (₿)', 'text-right'],
                          ['Cum PnL (₿)', 'text-right'],
                          ['Margin Bal (₿)', 'text-right'],
                          ['Equity (₿)', 'text-right'],
                          ['Equity (USD)', 'text-right'],
                        ] as const
                      ).map(([h, align]) => (
                        <th
                          key={h}
                          className={`px-3 py-2 font-medium text-text-muted whitespace-nowrap ${align}`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLog.map((a, i) => {
                      const btcP = a.btcPrice != null ? Number(a.btcPrice) : null;
                      const style = ACTION_BADGE[a.actionType] ?? {
                        color: 'text-text-secondary',
                        bg: 'bg-surface',
                      };
                      return (
                        <tr key={a.id ?? i} className={i % 2 === 0 ? '' : 'bg-surface/20'}>
                          <td className="px-3 py-1.5 text-text-muted whitespace-nowrap">
                            {fmtShort(a.timestamp)}
                          </td>
                          <td className="px-3 py-1.5">
                            <Badge
                              text={a.actionType}
                              variant="custom"
                              customColor={style.color}
                              customBgColor={style.bg}
                            />
                          </td>
                          <td className={`px-3 py-1.5 text-left font-mono ${
                            a.openPut && btcP && a.openPutStrike != null && a.openPutStrike > btcP
                              ? 'text-error' : 'text-text-primary'
                          }`}>
                            {a.openPut && a.openPutSize != null
                              ? `${a.openPutSize.toFixed(1)} ${a.openPut}`
                              : '—'}
                          </td>
                          <td className="px-3 py-1.5 text-right text-text-primary font-mono">
                            {btcP
                              ? '$' + btcP.toLocaleString('en-US', { maximumFractionDigits: 0 })
                              : '—'}
                          </td>
                          <td className={`px-3 py-1.5 text-left font-mono ${
                            a.openCall && btcP && a.openCallStrike != null && a.openCallStrike < btcP
                              ? 'text-error' : 'text-text-primary'
                          }`}>
                            {a.openCall && a.openCallSize != null
                              ? `${a.openCallSize.toFixed(1)} ${a.openCall}`
                              : '—'}
                          </td>
                          <td className="px-3 py-1.5 text-right">
                            {a.ivRank != null ? Number(a.ivRank).toFixed(1) : '—'}
                          </td>
                          <td className="px-3 py-1.5 text-right">
                            {a.delta != null ? Number(a.delta).toFixed(3) : '—'}
                          </td>
                          <td
                            className={`px-3 py-1.5 text-right font-mono ${clsColor(Number(a.pnlBtc) || 0)}`}
                          >
                            {n(a.pnlBtc)}
                          </td>
                          <td className={`px-3 py-1.5 text-right font-mono ${clsColor(a.cumPnl)}`}>
                            {n(a.cumPnl)}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono">
                            {a.marginBalanceBtc != null ? n(a.marginBalanceBtc, 4) : '—'}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono">{n(a.equity, 4)}</td>
                          <td className="px-3 py-1.5 text-right">
                            {btcP ? usd(a.equity * btcP) : '—'}
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
