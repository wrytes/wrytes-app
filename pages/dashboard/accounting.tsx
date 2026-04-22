import Head from 'next/head'
import { AccountingSection } from '@/components/features/Accounting'

export default function AccountingPage() {
  return (
    <>
      <Head>
        <title>Accounting – Wrytes</title>
        <meta name="description" content="Token transfer accounting and classification" />
      </Head>
      <AccountingSection />
    </>
  )
}
