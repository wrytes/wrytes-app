import Head from 'next/head';
import { useAuth } from '@/hooks/useAuth';
import { OnRampSection } from '@/components/features/routes';

export default function OnrampPage() {
  const { user } = useAuth();
  const isAdmin = user?.scopes.includes('ADMIN') ?? false;
  const hasScope = isAdmin || (user?.scopes.includes('ONRAMP') ?? false);

  return (
    <>
      <Head>
        <title>Onramp – Wrytes Routes</title>
      </Head>
      <OnRampSection hasScope={hasScope} />
    </>
  );
}
