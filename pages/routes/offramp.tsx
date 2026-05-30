import Head from 'next/head';
import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { OffRampSection, ExecutionHistorySection } from '@/components/features/Routes';
import type { OffRampRoute } from '@/components/features/Routes';

export default function OfframpPage() {
  const { user } = useAuth();
  const isAdmin = user?.scopes.includes('ADMIN') ?? false;
  const hasScope = isAdmin || (user?.scopes.includes('OFFRAMP') ?? false);

  const [routes, setRoutes] = useState<OffRampRoute[]>([]);
  const handleRoutesLoaded = useCallback((loaded: OffRampRoute[]) => setRoutes(loaded), []);

  return (
    <>
      <Head>
        <title>Offramp – Wrytes Routes</title>
      </Head>
      <OffRampSection
        isAdmin={isAdmin}
        hasScope={hasScope}
        onRoutesLoaded={handleRoutesLoaded}
      />
      <ExecutionHistorySection isAdmin={isAdmin} hasScope={hasScope} routes={routes} />
    </>
  );
}
