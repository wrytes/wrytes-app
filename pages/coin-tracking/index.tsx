import Head from 'next/head';
import { faScaleBalanced } from '@fortawesome/free-solid-svg-icons';
import { Section, PageHeader } from '@/components/ui/Layout';
import { TokenTransfersSection } from '@/components/features/TokenTransfers';

export default function AccountingPage() {
  return (
    <>
      <Head>
        <title>Accounting – Wrytes</title>
        <meta name="description" content="Track token transfers and classify transactions." />
      </Head>
      <Section>
        <PageHeader
          title="Accounting"
          description="Track token transfers and classify transactions."
          icon={faScaleBalanced}
        />
        <TokenTransfersSection />
      </Section>
    </>
  );
}
