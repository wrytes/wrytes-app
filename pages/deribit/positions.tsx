import Head from 'next/head';
import { useState } from 'react';
import { AgentError } from '@/components/features/DeribitAgent/AgentError';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLayerGroup, faRefresh } from '@fortawesome/free-solid-svg-icons';
import { Section, PageHeader } from '@/components/ui/Layout';
import Card from '@/components/ui/Card';
import { StatCard, StatCardSkeleton } from '@/components/ui/Stats/StatCard';
import { faBitcoinSign } from '@fortawesome/free-solid-svg-icons';
import { useDeribitFetch, type AccountSummary } from '@/lib/deribit-agent/client';
import { fmt } from '@/lib/deribit-agent/ui';

interface Order {
  order_id: string;
  instrument_name: string;
  direction: string;
  order_type: string;
  amount: number;
  price?: number;
  filled_amount: number;
  order_state: string;
  creation_timestamp: number;
  label?: string;
}

const CURRENCIES = ['BTC', 'ETH'] as const;
type Currency = typeof CURRENCIES[number];

export default function DeribitPositionsPage() {
  const [currency, setCurrency] = useState<Currency>('BTC');

  const summaryBtc = useDeribitFetch<AccountSummary>('/account/summary?currency=BTC');
  const summaryEth = useDeribitFetch<AccountSummary>('/account/summary?currency=ETH');
  const ordersBtc = useDeribitFetch<Order[]>('/trading/orders?currency=BTC');
  const ordersEth = useDeribitFetch<Order[]>('/trading/orders?currency=ETH');

  const summary = currency === 'BTC' ? summaryBtc : summaryEth;
  const orders = currency === 'BTC' ? ordersBtc : ordersEth;

  const refetchAll = () => {
    summaryBtc.refetch();
    summaryEth.refetch();
    ordersBtc.refetch();
    ordersEth.refetch();
  };

  return (
    <>
      <Head>
        <title>Deribit Agent — Positions</title>
      </Head>

      <Section>
        <PageHeader
          title="Positions"
          description="Open positions, account margins, and live orders."
          icon={faLayerGroup}
          actions={
            <button
              type="button"
              onClick={refetchAll}
              className="inline-flex items-center gap-2 bg-surface text-text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-80 transition-colors"
            >
              <FontAwesomeIcon icon={faRefresh} className="w-3 h-3" />
              Refresh
            </button>
          }
        />

        {/* Currency tabs */}
        <div className="flex gap-2 mt-4">
          {CURRENCIES.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currency === c
                  ? 'bg-brand text-white'
                  : 'bg-surface text-text-secondary hover:text-text-primary'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Account summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {summary.loading ? (
            [1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)
          ) : summary.data ? (
            <>
              <StatCard
                icon={faBitcoinSign}
                label="Equity"
                value={`${fmt(summary.data.equity)} ${currency}`}
                color="orange"
              />
              <StatCard
                icon={faBitcoinSign}
                label="Balance"
                value={`${fmt(summary.data.balance)} ${currency}`}
                color="blue"
              />
              <StatCard
                icon={faBitcoinSign}
                label="Available"
                value={`${fmt(summary.data.available_funds)} ${currency}`}
                color="green"
              />
              <StatCard
                icon={faBitcoinSign}
                label="Delta Total"
                value={fmt(summary.data.projected_delta_total, 3)}
                color="purple"
              />
            </>
          ) : summary.error ? (
            <div className="col-span-4">
              <AgentError message={summary.error!} onRetry={summary.refetch} />
            </div>
          ) : null}
        </div>

        {/* Margin details */}
        {!summary.loading && summary.data && (
          <Card className="mt-4">
            <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-3">
              Margin Details — {currency}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {[
                ['Margin Balance', `${fmt(summary.data.margin_balance)} ${currency}`],
                ['Initial Margin', `${fmt(summary.data.projected_initial_margin)} ${currency}`],
                ['Maint. Margin', `${fmt(summary.data.maintenance_margin)} ${currency}`],
                ['Margin Ratio', summary.data.equity > 0
                  ? `${((summary.data.maintenance_margin / summary.data.equity) * 100).toFixed(2)}%`
                  : '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <span className="text-text-muted text-xs">{label}</span>
                  <div className="text-text-primary font-mono mt-0.5">{value}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Open orders */}
        <div className="mt-8">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-3">
            Open Orders — {currency}
          </p>

          {orders.loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-card rounded-lg animate-pulse" />
              ))}
            </div>
          ) : orders.error ? (
            <AgentError message={orders.error} onRetry={orders.refetch} />
          ) : !orders.data?.length ? (
            <Card>
              <p className="text-text-muted text-sm text-center py-4">No open orders.</p>
            </Card>
          ) : (
            <Card className="overflow-x-auto p-0">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-surface">
                    {['Instrument', 'Side', 'Type', 'Amount', 'Price', 'Filled', 'State', 'Label'].map(h => (
                      <th key={h} className="text-left text-text-muted font-medium px-4 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.data.map((o, i) => (
                    <tr key={o.order_id} className={i % 2 === 0 ? '' : 'bg-surface/30'}>
                      <td className="px-4 py-3 text-text-primary font-mono text-xs">
                        {o.instrument_name}
                      </td>
                      <td className={`px-4 py-3 font-medium ${
                        o.direction === 'buy' ? 'text-success' : 'text-error'
                      }`}>
                        {o.direction.toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{o.order_type}</td>
                      <td className="px-4 py-3 text-text-primary font-mono">{o.amount}</td>
                      <td className="px-4 py-3 text-text-primary font-mono">
                        {o.price ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-text-secondary font-mono">{o.filled_amount}</td>
                      <td className="px-4 py-3 text-text-secondary">{o.order_state}</td>
                      <td className="px-4 py-3 text-text-muted text-xs">{o.label ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      </Section>
    </>
  );
}
