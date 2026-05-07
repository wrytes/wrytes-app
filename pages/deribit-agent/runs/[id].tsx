import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  LineController, BarController, DoughnutController,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler,
  type ChartConfiguration,
} from 'chart.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faRobot } from '@fortawesome/free-solid-svg-icons';
import { Section, PageHeader } from '@/components/ui/Layout';
import Card from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AgentError } from '@/components/features/DeribitAgent/AgentError';
import { useDeribitFetch, type AgentRun, type AgentAction } from '@/lib/deribit-agent/client';
import { RUN_STATUS_BADGE } from '@/lib/deribit-agent/ui';

ChartJS.register(
  LineController, BarController, DoughnutController,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler,
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
  return new Date(ts).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtShort(ts: string | number) {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

function parseLegs(instrument?: string | null) {
  const empty = { call: null as number | null, put: null as number | null, callInstrument: null as string | null, putInstrument: null as string | null };
  if (!instrument) return empty;
  const legs = instrument.split('|');
  let call: number | null = null, put: number | null = null;
  let callInstrument: string | null = null, putInstrument: string | null = null;
  legs.forEach(leg => {
    const p = leg.split('-');
    if (p.length < 4) return;
    const k = Number(p[2]), t = p[3].toUpperCase();
    if (t === 'C') { call = k; callInstrument = leg; }
    else if (t === 'P') { put = k; putInstrument = leg; }
  });
  return { call, put, callInstrument, putInstrument };
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
  sell_call:     { color: 'text-yellow-600', bg: 'bg-yellow-100/80' },
  sell_put:      { color: 'text-sky-600',    bg: 'bg-sky-100/80' },
  sell_strangle: { color: 'text-purple-600', bg: 'bg-purple-100/80' },
  close:         { color: 'text-error',      bg: 'bg-error/10' },
  hold:          { color: 'text-text-muted', bg: 'bg-surface' },
  buy_call:      { color: 'text-success',    bg: 'bg-success/10' },
  buy_put:       { color: 'text-rose-500',   bg: 'bg-rose-100/80' },
  hedge:         { color: 'text-yellow-500', bg: 'bg-yellow-400/10' },
};

const COMMON_LINE = { pointRadius: 0, borderWidth: 1.5, tension: 0.3 };

// ─── Chart canvas wrapper ─────────────────────────────────────────────────────

function ChartBox({ title, id, height = 200 }: { title: string; id: string; height?: number }) {
  return (
    <Card>
      <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-3">{title}</p>
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
  const actionsReq = useDeribitFetch<AgentAction[]>(runId ? `/agent/runs/${runId}/actions?limit=5000` : null);

  const chartsRef = useRef<Record<string, ChartJS>>({});
  const [chartsReady, setChartsReady] = useState(false);
  const [logTypeFilter, setLogTypeFilter] = useState('');
  const [logSearch, setLogSearch] = useState('');

  const destroyCharts = () => {
    Object.values(chartsRef.current).forEach(c => c.destroy());
    chartsRef.current = {};
  };

  useEffect(() => {
    if (!run.data || !actionsReq.data) return;

    // slight delay so canvas elements are mounted
    const t = setTimeout(() => {
      destroyCharts();
      buildCharts(run.data!, [...actionsReq.data!].reverse());
      setChartsReady(true);
    }, 50);
    return () => clearTimeout(t);
  }, [run.data, actionsReq.data]);

  useEffect(() => () => destroyCharts(), []);

  function buildCharts(runData: RunDetail, actions: AgentAction[]) {
    const initCap = Number(runData.initialCapitalBtc);
    const labels = actions.map(a => fmtDate(a.timestamp));

    let cum = 0;
    const cumPnlBtc = actions.map(a => { cum += Number(a.pnlBtc) || 0; return +cum.toFixed(6); });
    const equityBtc = cumPnlBtc.map(c => +(initCap + c).toFixed(6));
    const btcPrice  = actions.map(a => (a.btcPrice != null ? Number(a.btcPrice) : null));
    const equityUsd = equityBtc.map((e, i) => btcPrice[i] != null ? +(e * btcPrice[i]!).toFixed(0) : null);
    const cumPnlUsd = cumPnlBtc.map((p, i) => btcPrice[i] != null ? +(p * btcPrice[i]!).toFixed(0) : null);
    const rewardBar = actions.map(a => Number(a.pnlBtc) || 0);
    const ivData    = actions.map(a => a.ivRank != null ? Number(a.ivRank) : null);
    const deltaData = actions.map(a => a.delta != null ? Number(a.delta) : null);

    const callStrike: (number | null)[] = [];
    const putStrike: (number | null)[]  = [];
    let cK: number | null = null, pK: number | null = null;
    actions.forEach(a => {
      const t = a.actionType, legs = parseLegs(a.instrument);
      if (t === 'sell_call')    { cK = legs.call; }
      else if (t === 'sell_put') { pK = legs.put; }
      else if (t === 'sell_strangle') { if (legs.call != null) cK = legs.call; if (legs.put != null) pK = legs.put; }
      else if (t === 'close')   { cK = null; pK = null; }
      callStrike.push(cK);
      putStrike.push(pK);
    });

    const scales = (left: object, right?: object) => ({
      x: { ticks: { maxTicksLimit: 8, font: { size: 10 } }, grid: { color: '#ffffff10' } },
      y: { position: 'left' as const, ...left, grid: { color: '#ffffff10' }, ticks: { font: { size: 10 }, ...(left as any).ticks } },
      ...(right ? { y2: { position: 'right' as const, ...right, grid: { drawOnChartArea: false }, ticks: { font: { size: 10 }, ...(right as any).ticks } } } : {}),
    });

    function mk(id: string, cfg: ChartConfiguration) {
      const el = document.getElementById(id) as HTMLCanvasElement | null;
      if (!el) return;
      chartsRef.current[id] = new ChartJS(el, cfg);
    }

    // 1. Equity USD vs BTC Price
    mk('c-equity', {
      type: 'line',
      data: { labels, datasets: [
        { ...COMMON_LINE, label: 'Equity USD', data: equityUsd,
          borderColor: '#4e8ef7', backgroundColor: 'rgba(78,142,247,.12)', fill: true },
        { ...COMMON_LINE, label: 'BTC Price', data: btcPrice,
          borderColor: '#e6952c', backgroundColor: 'transparent' },
      ]},
      options: { responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { labels: { font: { size: 11 }, color: '#9ca3af' } } },
        scales: scales(
          { ticks: { callback: (v: any) => '$' + Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 }) } },
        ),
      },
    });

    // 2. BTC Price vs Strikes
    mk('c-strikes', {
      type: 'line',
      data: { labels, datasets: [
        { ...COMMON_LINE, label: 'BTC Price', data: btcPrice, borderColor: '#e6952c' },
        { ...COMMON_LINE, label: 'Call Strike', data: callStrike, borderColor: '#4e8ef7', stepped: true },
        { ...COMMON_LINE, label: 'Put Strike', data: putStrike, borderColor: '#ef4444', stepped: true },
      ]},
      options: { responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { labels: { font: { size: 11 }, color: '#9ca3af' } } },
        scales: scales({ ticks: { callback: (v: any) => '$' + Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 }) } }),
      },
    });

    // 3. P&L USD
    mk('c-pnlusd', {
      type: 'line',
      data: { labels, datasets: [{ ...COMMON_LINE, label: 'P&L (USD)', data: cumPnlUsd,
        fill: { target: 'origin', above: 'rgba(26,127,55,.15)', below: 'rgba(207,34,46,.15)' },
        segment: { borderColor: (ctx: any) => ctx.p0.parsed.y >= 0 ? '#1a7f37' : '#cf222e' },
        backgroundColor: 'transparent',
      }]},
      options: { responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false } },
        scales: scales({ ticks: { callback: (v: any) => (v >= 0 ? '+' : '') + usd(v) } }),
      },
    });

    // 4. P&L BTC
    mk('c-pnlbtc', {
      type: 'line',
      data: { labels, datasets: [{ ...COMMON_LINE, label: 'P&L (₿)', data: cumPnlBtc,
        fill: { target: 'origin', above: 'rgba(26,127,55,.15)', below: 'rgba(207,34,46,.15)' },
        segment: { borderColor: (ctx: any) => ctx.p0.parsed.y >= 0 ? '#1a7f37' : '#cf222e' },
        backgroundColor: 'transparent',
      }]},
      options: { responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false } },
        scales: scales({ ticks: { callback: (v: any) => (v >= 0 ? '+' : '') + Number(v).toFixed(4) + '₿' } }),
      },
    });

    // 5a. Equity BTC
    mk('c-eqbtc', {
      type: 'line',
      data: { labels, datasets: [{ ...COMMON_LINE, label: 'Equity (₿)', data: equityBtc,
        borderColor: '#4e8ef7', backgroundColor: 'rgba(78,142,247,.1)', fill: true }]},
      options: { responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { labels: { font: { size: 11 }, color: '#9ca3af' } } },
        scales: scales({ ticks: { callback: (v: any) => Number(v).toFixed(2) + '₿' } }),
      },
    });

    // 5b. Daily Reward
    mk('c-reward', {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Reward', data: rewardBar,
        backgroundColor: rewardBar.map(v => v >= 0 ? 'rgba(26,127,55,.7)' : 'rgba(207,34,46,.7)'),
        borderWidth: 0,
      }]},
      options: { responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: scales({ ticks: { callback: (v: any) => Number(v).toFixed(4) } }),
      },
    });

    // 6. IV Rank & Delta
    mk('c-iv', {
      type: 'line',
      data: { labels, datasets: [
        { ...COMMON_LINE, label: 'IV Rank (DVOL)', data: ivData, yAxisID: 'y',
          borderColor: '#8b5cf6', backgroundColor: 'transparent' },
        { ...COMMON_LINE, label: 'Portfolio Delta', data: deltaData, yAxisID: 'y2',
          borderColor: '#0ea5e9', backgroundColor: 'rgba(14,165,233,.08)', fill: true },
      ]},
      options: { responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { labels: { font: { size: 11 }, color: '#9ca3af' } } },
        scales: scales(
          { title: { display: true, text: 'IV Rank', font: { size: 10 } } },
          { title: { display: true, text: 'Delta', font: { size: 10 } } },
        ),
      },
    });

    // 7. Doughnut
    const typeCnt: Record<string, number> = {};
    actions.forEach(a => { typeCnt[a.actionType] = (typeCnt[a.actionType] || 0) + 1; });
    const pieL = Object.keys(typeCnt);
    const el7 = document.getElementById('c-pie') as HTMLCanvasElement | null;
    if (el7) {
      chartsRef.current['c-pie'] = new ChartJS<'doughnut'>(el7, {
        type: 'doughnut',
        data: { labels: pieL, datasets: [{ data: pieL.map(k => typeCnt[k]),
          backgroundColor: pieL.map(k => ACTION_COLORS[k] || '#94a3b8'), borderWidth: 1,
        }]},
        options: { responsive: true, maintainAspectRatio: false, cutout: '60%',
          plugins: { legend: { position: 'right', labels: { font: { size: 11 }, color: '#9ca3af', padding: 10 } } },
        },
      });
    }
  }

  // ── Derived stats ────────────────────────────────────────────────────────────
  const actions = actionsReq.data ? [...actionsReq.data].reverse() : [];
  const runData = run.data;
  const initCap = runData ? Number(runData.initialCapitalBtc) : 0;
  const nonHold = actions.filter(a => a.actionType !== 'hold');
  const allPnls = nonHold.map(a => Number(a.pnlBtc) || 0);
  const totalPnl = allPnls.reduce((s, v) => s + v, 0);
  const wins = allPnls.filter(v => v > 0).length;
  const winRate = nonHold.length ? wins / nonHold.length * 100 : 0;
  const best = allPnls.length ? Math.max(...allPnls) : 0;
  const worst = allPnls.length ? Math.min(...allPnls) : 0;
  const lastBtc = actions.length ? Number(actions[actions.length - 1].btcPrice) || 0 : 0;
  const finalEq = initCap + totalPnl;

  // type breakdown
  const typeSummary: Record<string, { count: number; total: number }> = {};
  actions.forEach(a => {
    if (!typeSummary[a.actionType]) typeSummary[a.actionType] = { count: 0, total: 0 };
    typeSummary[a.actionType].count++;
    typeSummary[a.actionType].total += Number(a.pnlBtc) || 0;
  });

  // cumulative pnl for the log table
  const actionLog = (() => {
    let c = 0;
    return actions.map(a => {
      c += Number(a.pnlBtc) || 0;
      return { ...a, cumPnl: c, equity: initCap + c };
    });
  })();

  // unique action types for filter chips (stable order)
  const uniqueTypes = Array.from(new Set(actions.map(a => a.actionType)));

  // filtered + reversed log (newest first)
  const filteredLog = [...actionLog].reverse().filter(a => {
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
        <title>Deribit Agent — Run {runId?.slice(0, 8)}</title>
      </Head>

      <Section>
        <PageHeader
          title={runData?.name ?? 'Agent Run'}
          description={runData
            ? `${runData.currency} · ${runData.runType ?? 'PAPER'} · ${runData.status}`
            : 'Loading…'}
          icon={faRobot}
          actions={
            <button
              type="button"
              onClick={() => router.push('/deribit-agent/runs')}
              className="inline-flex items-center gap-2 bg-surface text-text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-80 transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="w-3 h-3" />
              Back to Runs
            </button>
          }
        />

        {loading && (
          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1,2,3,4,5,6,7].map(i => <div key={i} className="h-20 bg-card rounded-lg animate-pulse" />)}
            </div>
            <div className="h-52 bg-card rounded-lg animate-pulse" />
            <div className="h-52 bg-card rounded-lg animate-pulse" />
          </div>
        )}

        {error && <AgentError message={error} onRetry={() => { run.refetch(); actionsReq.refetch(); }} />}

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
                  Model: <span className="text-text-primary">{runData.session.name}</span>
                  {' '}({runData.session.algorithm})
                </span>
                {runData.startedAt && (
                  <span className="text-text-muted text-xs">
                    Started {new Date(runData.startedAt).toLocaleString()}
                  </span>
                )}
              </div>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
              {[
                { label: 'Actions', value: actions.length, sub: `${nonHold.length} trades` },
                { label: 'Net PnL', value: `${n(totalPnl)} ₿`, sub: pctStr(initCap ? totalPnl / initCap * 100 : 0), cls: clsColor(totalPnl) },
                { label: 'Net PnL USD', value: usd(totalPnl * lastBtc || null), sub: 'at last BTC price', cls: clsColor(totalPnl) },
                { label: 'Equity', value: `${n(finalEq, 4)} ₿`, cls: clsColor(totalPnl) },
                { label: 'Win Rate', value: `${winRate.toFixed(1)}%`, sub: `${wins}/${nonHold.length}` },
                { label: 'Best Trade', value: `${n(best)} ₿`, cls: 'text-success' },
                { label: 'Worst Trade', value: `${n(worst)} ₿`, cls: 'text-error' },
                { label: 'Capital', value: `${n(initCap, 4)} ₿`, cls: '' },
              ].map(s => (
                <Card key={s.label} className="flex flex-col gap-1">
                  <span className="text-text-muted text-xs uppercase tracking-wide">{s.label}</span>
                  <span className={`text-xl font-bold ${s.cls ?? ''}`}>{s.value}</span>
                  {s.sub && <span className="text-text-muted text-xs">{s.sub}</span>}
                </Card>
              ))}
            </div>

            {/* Primary charts */}
            <div className="mt-6 space-y-4">
              <ChartBox id="c-equity" title="Equity (USD) vs BTC Price" height={220} />
              <ChartBox id="c-strikes" title="BTC Price vs Strikes" height={220} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ChartBox id="c-pnlusd" title="P&L (USD)" height={200} />
                <ChartBox id="c-pnlbtc" title="P&L (₿)" height={200} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ChartBox id="c-eqbtc" title="Equity (₿)" height={180} />
                <ChartBox id="c-reward" title="Daily Reward" height={180} />
              </div>
              <ChartBox id="c-iv" title="IV Rank & Portfolio Delta" height={200} />
            </div>

            {/* Action breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <ChartBox id="c-pie" title="Action Breakdown" height={200} />
              <Card>
                <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-3">By Action Type</p>
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
                        const style = ACTION_BADGE[type] ?? { color: 'text-text-secondary', bg: 'bg-surface' };
                        return (
                          <tr key={type} className="border-b border-surface/50">
                            <td className="py-2">
                              <Badge text={type} variant="custom" customColor={style.color} customBgColor={style.bg} />
                            </td>
                            <td className="text-right text-text-primary font-mono">{s.count}</td>
                            <td className={`text-right font-mono ${clsColor(s.total)}`}>{n(s.total)}</td>
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
                      {([
                        ['Date',        'text-left'],
                        ['Action',      'text-left'],
                        ['BTC Price',   'text-right'],
                        ['Call',        'text-left'],
                        ['Put',         'text-left'],
                        ['IV Rank',     'text-right'],
                        ['Delta',       'text-right'],
                        ['PnL (₿)',     'text-right'],
                        ['Cum PnL (₿)','text-right'],
                        ['Equity (₿)', 'text-right'],
                        ['Equity (USD)','text-right'],
                      ] as const).map(([h, align]) => (
                        <th key={h} className={`px-3 py-2 font-medium text-text-muted whitespace-nowrap ${align}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLog.map((a, i) => {
                      const legs = parseLegs(a.instrument);
                      const btcP = a.btcPrice != null ? Number(a.btcPrice) : null;
                      const style = ACTION_BADGE[a.actionType] ?? { color: 'text-text-secondary', bg: 'bg-surface' };
                      return (
                        <tr key={a.id ?? i} className={i % 2 === 0 ? '' : 'bg-surface/20'}>
                          <td className="px-3 py-1.5 text-text-muted whitespace-nowrap">{fmtShort(a.timestamp)}</td>
                          <td className="px-3 py-1.5">
                            <Badge text={a.actionType} variant="custom" customColor={style.color} customBgColor={style.bg} />
                          </td>
                          <td className="px-3 py-1.5 text-right text-text-primary font-mono">
                            {btcP ? '$' + btcP.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—'}
                          </td>
                          <td className="px-3 py-1.5 text-left">
                            {legs.callInstrument ? (
                              <div>
                                <div className="font-mono text-text-primary">{legs.callInstrument}</div>
                                {a.quantity != null && (
                                  <div className="text-text-muted">qty {a.quantity}</div>
                                )}
                              </div>
                            ) : '—'}
                          </td>
                          <td className="px-3 py-1.5 text-left">
                            {legs.putInstrument ? (
                              <div>
                                <div className="font-mono text-text-primary">{legs.putInstrument}</div>
                                {a.quantity != null && (
                                  <div className="text-text-muted">qty {a.quantity}</div>
                                )}
                              </div>
                            ) : '—'}
                          </td>
                          <td className="px-3 py-1.5 text-right">{a.ivRank != null ? Number(a.ivRank).toFixed(1) : '—'}</td>
                          <td className="px-3 py-1.5 text-right">{a.delta != null ? Number(a.delta).toFixed(3) : '—'}</td>
                          <td className={`px-3 py-1.5 text-right font-mono ${clsColor(Number(a.pnlBtc) || 0)}`}>{n(a.pnlBtc)}</td>
                          <td className={`px-3 py-1.5 text-right font-mono ${clsColor(a.cumPnl)}`}>{n(a.cumPnl)}</td>
                          <td className="px-3 py-1.5 text-right font-mono">{n(a.equity, 4)}</td>
                          <td className="px-3 py-1.5 text-right">{btcP ? usd(a.equity * btcP) : '—'}</td>
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
