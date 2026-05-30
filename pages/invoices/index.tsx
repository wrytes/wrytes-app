import Head from 'next/head';
import { faFileInvoice } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/hooks/useAuth';
import { Section, PageHeader } from '@/components/ui/Layout';
import { BillListSection } from '@/components/features/Bills';

export default function BillsPage() {
  const { user } = useAuth();
  const isAdmin = user?.scopes.includes('ADMIN') ?? false;

  return (
    <>
      <Head>
        <title>Bills – Wrytes</title>
        <meta
          name="description"
          content="Upload bill documents — AI extracts the details and assigns a payment address."
        />
      </Head>
      <Section>
        <PageHeader
          title="Bills"
          description="Upload bill documents — AI extracts the details and assigns a payment address."
          icon={faFileInvoice}
        />
        <BillListSection isAdmin={isAdmin} />
      </Section>
    </>
  );
}
