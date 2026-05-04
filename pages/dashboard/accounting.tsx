import Head from 'next/head';
import { useState } from 'react';
import { faScaleBalanced, faFileInvoice, faFileInvoiceDollar, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAuth } from '@/hooks/useAuth';
import PageTabInput from '@/components/ui/Input/PageTabInput';
import { Section, PageHeader } from '@/components/ui/Layout';
import { ButtonInput } from '@/components/ui/Input';
import { TokenTransfersSection } from '@/components/features/TokenTransfers';
import { BillListSection } from '@/components/features/Bills';
import { InvoiceListSection } from '@/components/features/Invoices';

export default function AccountingPage() {
  const { user } = useAuth();
  const isAdmin = user?.scopes.includes('ADMIN') ?? false;
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  return (
    <>
      <Head>
        <title>Accounting – Wrytes</title>
        <meta name="description" content="Token transfers, bills, invoices and accounting overview" />
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
            label: 'Bills',
            content: (
              <Section>
                <PageHeader
                  title="Bills"
                  description="Upload bill documents — AI extracts the details and assigns a payment address."
                  icon={faFileInvoice}
                />
                <BillListSection isAdmin={isAdmin} />
              </Section>
            ),
          },
          {
            label: 'Invoices',
            content: (
              <Section>
                <PageHeader
                  title="Invoices"
                  description="Create and send invoices to clients. Track payment status."
                  icon={faFileInvoiceDollar}
                  actions={
                    <ButtonInput
                      label="New Invoice"
                      icon={<FontAwesomeIcon icon={faPlus} />}
                      variant="primary"
                      size="sm"
                      onClick={() => setCreatingInvoice(true)}
                    />
                  }
                />
                <InvoiceListSection
                  creating={creatingInvoice}
                  onCloseCreate={() => setCreatingInvoice(false)}
                />
              </Section>
            ),
          },
        ]}
      />
    </>
  );
}
