import Head from 'next/head';
import { useAuth } from '@/hooks/useAuth';
import {
  ProfileFormSection,
  LinkedWalletsSection,
  ApiKeysSection,
} from '@/components/features/Profile';

export default function ProfilePage() {
  const { user } = useAuth();
  const isAdmin = user?.scopes.includes('ADMIN') ?? false;
  const hasLoginScope = isAdmin || (user?.scopes.includes('LOGIN') ?? false);

  return (
    <>
      <Head>
        <title>Profile – Wrytes</title>
      </Head>
      <ProfileFormSection isAdmin={isAdmin} hasScope={hasLoginScope} userId={user?.id} />
      <LinkedWalletsSection hasScope={hasLoginScope} />
      <ApiKeysSection hasScope={hasLoginScope} />
    </>
  );
}
