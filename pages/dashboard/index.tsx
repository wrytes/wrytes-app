import { useEffect, useState } from 'react';
import Head from 'next/head';
import { faLightbulb, faArrowTrendUp, faArrowTrendDown, faScaleBalanced } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/hooks/useAuth';
import { UserBadge } from '@/components/auth/RequireScope';
import { PageHeader, Section } from '@/components/ui/Layout';
import { StatGrid } from '@/components/ui/Stats';
import { apiRequest } from '@/lib/api/client';
import { formatCurrency, FormatType } from '@/lib/utils/format-handling';
import type { TrialBalanceLine } from '@/components/features/Accounting/types';

function fmtChf(value: number): string {
  return `CHF ${formatCurrency(value, 0, 2, FormatType.tiny) ?? '0'}`;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [trialBalance, setTrialBalance] = useState<TrialBalanceLine[] | null>(null);
  const [loading, setLoading] = useState(true);

  const displayName = user?.telegramHandle
    ? `@${user.telegramHandle}`
    : user?.profile
      ? `${user.profile.firstName} ${user.profile.lastName}`.trim()
      : user?.walletAddress
        ? `${user.walletAddress.slice(0, 6)}…${user.walletAddress.slice(-4)}`
        : null;

  useEffect(() => {
    apiRequest<TrialBalanceLine[]>('/accounting/trial-balance')
      .then(data => setTrialBalance(data))
      .catch(() => setTrialBalance([]))
      .finally(() => setLoading(false));
  }, []);

  const assets = trialBalance?.filter(l => l.type === 'ASSET').reduce((s, l) => s + l.chfNet, 0) ?? 0;
  const liabilities = trialBalance?.filter(l => l.type === 'LIABILITY').reduce((s, l) => s + l.chfNet, 0) ?? 0;
  const net = assets - Math.abs(liabilities);

  const stats = [
    {
      icon: faArrowTrendUp,
      label: 'Total Assets',
      value: fmtChf(assets),
      color: 'green' as const,
    },
    {
      icon: faArrowTrendDown,
      label: 'Total Liabilities',
      value: fmtChf(Math.abs(liabilities)),
      color: 'yellow' as const,
    },
    {
      icon: faScaleBalanced,
      label: 'Net (Assets − Liabilities)',
      value: fmtChf(net),
      color: net >= 0 ? 'blue' as const : 'purple' as const,
    },
  ];

  return (
    <>
      <Head>
        <title>Dashboard - Wrytes</title>
        <meta name="description" content="Dashboard overview" />
      </Head>

      <Section>
        <PageHeader
          title="Dashboard Overview"
          description={`Welcome back${displayName ? `, ${displayName}` : ''}! Here's what's happening with your portfolio.`}
          icon={faLightbulb}
          userInfo={user && <UserBadge />}
        />
        <StatGrid stats={loading ? [] : stats} columns={{ base: 1, md: 3 }} loading={loading} />
      </Section>
    </>
  );
}
