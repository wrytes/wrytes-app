import Head from 'next/head';
import { useState } from 'react';
import { faFileInvoiceDollar, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Section, PageHeader } from '@/components/ui/layout';
import { ButtonInput } from '@/components/ui/input';
import { InvoiceListSection } from '@/components/features/invoices';

export default function InvoicesPage() {
  const [creating, setCreating] = useState(false);

  return (
    <>
      <Head>
        <title>Invoices – Wrytes</title>
        <meta name="description" content="Create and send invoices to clients. Track payment status." />
      </Head>
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
              onClick={() => setCreating(true)}
            />
          }
        />
        <InvoiceListSection
          creating={creating}
          onCloseCreate={() => setCreating(false)}
        />
      </Section>
    </>
  );
}
