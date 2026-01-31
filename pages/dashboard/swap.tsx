import Head from 'next/head';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightArrowLeft, faInfoCircle, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import Card from '@/components/ui/Card';
import { PageHeader, Section } from '@/components/ui/Layout';
import { SwapForm } from '@/components/features/Swap';

export default function SwapPage() {
  return (
    <>
      <Head>
        <title>Swap - Wrytes</title>
        <meta name="description" content="Swap tokens via CoW Protocol with MEV protection" />
      </Head>

      <div className="space-y-6">
        <PageHeader
          title="Swap"
          description="Swap tokens via CoW Protocol with MEV protection"
          icon={faArrowRightArrowLeft}
        />

        <Section>
          <Card>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faShieldHalved} className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">CoW Protocol</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  CoW Protocol finds the best prices across DEXs and protects you from MEV
                  (Miner Extractable Value) attacks like frontrunning and sandwich attacks.
                  Orders are matched peer-to-peer when possible, and settled on-chain through
                  batch auctions for optimal execution.
                </p>
              </div>
            </div>
          </Card>
        </Section>

        <Section>
          <Card>
            <SwapForm />
          </Card>
        </Section>

        <Section>
          <Card>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-yellow-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faInfoCircle} className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Risk Disclaimer</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  Token swaps are executed through CoW Protocol smart contracts. While CoW Protocol
                  provides MEV protection, all DeFi interactions carry inherent risks including smart
                  contract vulnerabilities and price volatility. Always verify token addresses and
                  review transaction details before confirming. Only trade with funds you can afford to lose.
                </p>
              </div>
            </div>
          </Card>
        </Section>
      </div>
    </>
  );
}
