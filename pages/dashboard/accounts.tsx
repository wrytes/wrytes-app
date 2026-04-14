import Head from 'next/head';
import { useAuth } from '@/hooks/useAuth';
import { BankAccountsSection, SafeWalletsSection } from '@/components/features/Accounts';

export default function AccountsPage() {
  const { user } = useAuth();
  const isAdmin = user?.scopes.includes('ADMIN') ?? false;
  const hasSafeScope = isAdmin || (user?.scopes.includes('SAFE') ?? false);

  return (
    <>
      <Head>
        <title>Accounts – Wrytes</title>
      </Head>
      <BankAccountsSection isAdmin={isAdmin} />
      <SafeWalletsSection hasScope={hasSafeScope} />
    </>
  );
}
