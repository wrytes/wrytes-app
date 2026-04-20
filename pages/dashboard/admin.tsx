import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import TokenMinimumsSection from '@/components/features/Admin/TokenMinimumsSection';

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.scopes?.includes('ADMIN') ?? false;

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAdmin, router]);

  if (isLoading || !isAdmin) return null;

  return (
    <>
      <Head>
        <title>Admin – Wrytes</title>
      </Head>
      <TokenMinimumsSection />
    </>
  );
}
