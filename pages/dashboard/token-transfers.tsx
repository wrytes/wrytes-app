import Head from 'next/head'
import { TokenTransfersSection } from '@/components/features/TokenTransfers'

export default function TokenTransfersPage() {
  return (
    <>
      <Head>
        <title>Token Transfers – Wrytes</title>
        <meta name="description" content="Token balances and transfer history" />
      </Head>
      <TokenTransfersSection />
    </>
  )
}
