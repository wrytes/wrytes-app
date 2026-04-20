import Head from 'next/head';
import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  OnRampSection,
  OffRampSection,
  ExecutionHistorySection,
} from '@/components/features/Routes';
import type { OffRampRoute } from '@/components/features/Routes';
import PageTabInput from '@/components/ui/Input/PageTabInput';
import { Section } from '@/components/ui/Layout';

function ComingSoon({ label }: { label: string }) {
  return (
    <Section>
      <p className="text-text-secondary text-sm">{label} — coming soon.</p>
    </Section>
  );
}

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
      <PageTabInput
        tabs={[
          {
            label: 'On-Ramp',
            content: <OnRampSection hasScope={hasOnramp} />,
          },
          {
            label: 'Off-Ramp',
            content: (
              <>
                <OffRampSection
                  isAdmin={isAdmin}
                  hasScope={hasOfframp}
                  onRoutesLoaded={handleRoutesLoaded}
                />
                <ExecutionHistorySection isAdmin={isAdmin} hasScope={hasOfframp} routes={routes} />
              </>
            ),
          },
          {
            label: 'Bridge',
            content: <ComingSoon label="Bridge" />,
          },
        ]}
      />
    </>
  );
}
