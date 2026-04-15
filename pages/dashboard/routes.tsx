import Head from 'next/head';
import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  OnRampSection,
  OffRampSection,
  ExecutionHistorySection,
} from '@/components/features/Routes';
import type { OffRampRoute } from '@/components/features/Routes';

export default function RampingPage() {
  const { user } = useAuth();
  const isAdmin = user?.scopes.includes('ADMIN') ?? false;
  const hasOfframp = isAdmin || (user?.scopes.includes('OFFRAMP') ?? false);
  const hasOnramp = isAdmin || (user?.scopes.includes('ONRAMP') ?? false);

  const [routes, setRoutes] = useState<OffRampRoute[]>([]);
  const handleRoutesLoaded = useCallback((loaded: OffRampRoute[]) => setRoutes(loaded), []);

  return (
    <>
      <Head>
        <title>Routes – Wrytes</title>
      </Head>
      <OnRampSection hasScope={hasOnramp} />
      <OffRampSection isAdmin={isAdmin} hasScope={hasOfframp} onRoutesLoaded={handleRoutesLoaded} />
      <ExecutionHistorySection isAdmin={isAdmin} hasScope={hasOfframp} routes={routes} />
    </>
  );
}
