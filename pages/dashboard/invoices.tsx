import Head from 'next/head';
import { useAuth } from '@/hooks/useAuth';
import { InvoiceListSection } from '@/components/features/Invoices';

export default function InvoicesPage() {
  const { user } = useAuth();
  const isAdmin = user?.scopes.includes('ADMIN') ?? false;

  return (
    <>
      <Head>
        <title>Invoices – Wrytes</title>
        <meta name="description" content="Upload and manage invoices with AI extraction" />
      </Head>
      <InvoiceListSection isAdmin={isAdmin} />
    </>
  );
}
