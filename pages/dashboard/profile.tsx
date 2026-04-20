import Head from 'next/head';
import { useAuth } from '@/hooks/useAuth';
import {
  ProfileFormSection,
  LinkedWalletsSection,
  ApiKeysSection,
} from '@/components/features/Profile';
import { BankAccountsSection } from '@/components/features/Accounts';

export default function ProfilePage() {
  const { user } = useAuth();
  const isAdmin = user?.scopes.includes('ADMIN') ?? false;
  const hasLoginScope = isAdmin || (user?.scopes.includes('LOGIN') ?? false);
  const hasBankScope = isAdmin || (user?.scopes.includes('BANK') ?? false);

  return (
    <>
      <Head>
        <title>Profile – Wrytes</title>
      </Head>
      <ProfileFormSection isAdmin={isAdmin} hasScope={hasLoginScope} userId={user?.id} />
      <BankAccountsSection hasScope={hasBankScope} />
      <LinkedWalletsSection hasScope={hasLoginScope} />
      <ApiKeysSection hasScope={hasLoginScope} />
    </>
  );
}
