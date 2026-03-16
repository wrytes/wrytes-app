import Head from 'next/head';
import { faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/hooks/useAuth';
import { RoleBadge } from '@/components/auth/RequireRole';
import { PageHeader } from '@/components/ui/Layout';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <>
      <Head>
        <title>Dashboard - Wrytes</title>
        <meta name="description" content="Dashboard overview" />
      </Head>

      <div className="space-y-6">
        <PageHeader
          title="Dashboard Overview"
          description={`Welcome back${user && user.walletAddress ? `, ${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` : ''}! Here's what's happening with your projects.`}
          icon={faLightbulb}
          userInfo={user && <RoleBadge />}
        />
      </div>
    </>
  );
}
