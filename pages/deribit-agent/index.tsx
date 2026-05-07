import Head from 'next/head';
import { faChartLine, faBitcoinSign, faRobot, faBrain } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Section, PageHeader } from '@/components/ui/Layout';
import { StatCard, StatCardSkeleton } from '@/components/ui/Stats/StatCard';
import Card from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AgentError } from '@/components/features/DeribitAgent/AgentError';
import {
  useDeribitFetch,
  type AccountSummary,
  type AccountSummariesResponse,
  type AgentRun,
  type TrainedModel,
  type DataStatus,
  type TrackedInstrument,
} from '@/lib/deribit-agent/client';
import { RUN_STATUS_BADGE, fmt, fmtDate } from '@/lib/deribit-agent/ui';

export default function DeribitOverviewPage() {
  const summaries = useDeribitFetch<AccountSummariesResponse>('/account/summaries');
  const runs = useDeribitFetch<AgentRun[]>('/agent/runs');
  const models = useDeribitFetch<TrainedModel[]>('/training/models');
  const dataStatus = useDeribitFetch<DataStatus>('/data/status');

  const btc = summaries.data?.summaries?.find(s => s.currency === 'BTC');
  const eth = summaries.data?.summaries?.find(s => s.currency === 'ETH');
  const activeRuns = runs.data?.filter(r => r.status === 'ACTIVE') ?? [];
  const recentRuns = runs.data?.slice(0, 5) ?? [];

  return (
    <>
      <Head>
        <title>Deribit Agent — Overview</title>
      </Head>

      <Section>
        <PageHeader
          title="Overview"
          description="Account summary and agent status."
          icon={faChartLine}
        />

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {summaries.loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                icon={faBitcoinSign}
                label="BTC Equity"
                value={btc ? `${fmt(btc.equity)} BTC` : '—'}
                color="orange"
              />
              <StatCard
                icon={faBitcoinSign}
                label="ETH Equity"
                value={eth ? `${fmt(eth.equity)} ETH` : '—'}
                color="purple"
              />
            </>
          )}

          {runs.loading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              icon={faRobot}
              label="Active Runs"
              value={activeRuns.length}
              color="green"
            />
          )}

          {models.loading ? (
            <StatCardSkeleton />
          ) : (
            <StatCard
              icon={faBrain}
              label="Trained Models"
              value={models.data?.length ?? 0}
              color="blue"
            />
          )}
        </div>

        {/* Account detail rows */}
        {!summaries.loading && (btc || eth) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {[btc, eth].filter(Boolean).map(s => (
              <Card key={s!.currency}>
                <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-3">
                  {s!.currency} Account
                </p>
                <div className="space-y-2">
                  {([
                    ['Balance', `${fmt(s!.balance)} ${s!.currency}`],
                    ['Margin Balance', `${fmt(s!.margin_balance)} ${s!.currency}`],
                    ['Available', `${fmt(s!.available_funds)} ${s!.currency}`],
                    ['Maint. Margin', `${fmt(s!.maintenance_margin)} ${s!.currency}`],
                    ['Delta Total', fmt(s!.projected_delta_total)],
                  ] as [string, string][]).map(([label, value]) => (
                    <div key={label as string} className="flex justify-between text-sm">
                      <span className="text-text-muted">{label}</span>
                      <span className="text-text-primary font-mono">{value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}

        {summaries.error && (
          <AgentError message={summaries.error} onRetry={summaries.refetch} />
        )}

        {/* Recent runs */}
        <div className="mt-8">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-3">
            Recent Agent Runs
          </p>
          {runs.loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 bg-card rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentRuns.length === 0 ? (
            <Card>
              <p className="text-text-muted text-sm text-center py-4">No runs yet.</p>
            </Card>
          ) : (
            <Card className="overflow-hidden p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface">
                    <th className="text-left text-text-muted font-medium px-4 py-3">Name</th>
                    <th className="text-left text-text-muted font-medium px-4 py-3">Currency</th>
                    <th className="text-left text-text-muted font-medium px-4 py-3">Status</th>
                    <th className="text-left text-text-muted font-medium px-4 py-3">Mode</th>
                    <th className="text-left text-text-muted font-medium px-4 py-3">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRuns.map((run, i) => (
                    <tr
                      key={run.id}
                      className={i % 2 === 0 ? 'bg-transparent' : 'bg-surface/30'}
                    >
                      <td className="px-4 py-3 text-text-primary font-medium">{run.name}</td>
                      <td className="px-4 py-3 text-text-secondary">{run.currency}</td>
                      <td className="px-4 py-3">
                        <Badge
                          text={run.status}
                          variant="custom"
                          customColor={RUN_STATUS_BADGE[run.status].color}
                          customBgColor={RUN_STATUS_BADGE[run.status].bg}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className={run.runType === 'LIVE' ? 'text-error text-xs font-semibold' : 'text-text-muted text-xs'}>
                          {run.runType ?? 'PAPER'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-muted">{fmtDate(run.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>

        {/* Data status */}
        {!dataStatus.loading && dataStatus.data && (
          <div className="mt-8">
            <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-3">
              Data Ingestion — Tracked Instruments
            </p>
            <Card>
              {dataStatus.data.tracked.length === 0 ? (
                <p className="text-text-muted text-sm">No instruments tracked.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {dataStatus.data.tracked.map((item: TrackedInstrument) => (
                    <span
                      key={`${item.instrument}-${item.resolution}`}
                      className="text-xs font-mono bg-surface px-2 py-1 rounded text-text-secondary"
                    >
                      {item.instrument}
                      <span className="text-text-muted ml-1 opacity-60">{item.resolution}</span>
                    </span>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </Section>
    </>
  );
}
