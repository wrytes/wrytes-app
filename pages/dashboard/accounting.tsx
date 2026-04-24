import Head from 'next/head';
import { useAuth } from '@/hooks/useAuth';
import PageTabInput from '@/components/ui/Input/PageTabInput';
import { Section, PageHeader } from '@/components/ui/Layout';
import { TokenTransfersSection } from '@/components/features/TokenTransfers';
import { InvoiceListSection } from '@/components/features/Invoices';
import { faScaleBalanced } from '@fortawesome/free-solid-svg-icons';

export default function AccountingPage() {
  const { user } = useAuth();
  const isAdmin = user?.scopes.includes('ADMIN') ?? false;

  return (
    <>
      <Head>
        <title>Accounting – Wrytes</title>
        <meta name="description" content="Token transfers, invoices and accounting overview" />
      </Head>
      <PageTabInput
        tabs={[
          {
            label: 'Token Transfers',
            content: (
              <Section>
                <PageHeader
                  title="Accounting"
                  description="Track token transfers, classify transactions and manage invoices."
                  icon={faScaleBalanced}
                />
                <TokenTransfersSection />
              </Section>
            ),
          },
          {
            label: 'Invoices',
            content: <InvoiceListSection isAdmin={isAdmin} />,
          },
        ]}
      />
    </>
  );
}
