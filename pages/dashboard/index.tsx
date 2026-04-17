import Head from 'next/head';
import { faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/hooks/useAuth';
import { UserBadge } from '@/components/auth/RequireScope';
import { PageHeader, Section } from '@/components/ui/Layout';
import { StatGrid } from '@/components/ui/Stats';

export default function Dashboard() {
  const { user } = useAuth();

  const displayName = user?.telegramHandle
    ? `@${user.telegramHandle}`
    : user?.profile
      ? `${user.profile.firstName} ${user.profile.lastName}`.trim()
      : user?.walletAddress
        ? `${user.walletAddress.slice(0, 6)}…${user.walletAddress.slice(-4)}`
        : null;

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
        <StatGrid stats={[]} columns={{ base: 1, md: 2, lg: 4 }} loading />
      </Section>
    </>
  );
}
