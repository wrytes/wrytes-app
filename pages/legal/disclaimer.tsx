import Head from 'next/head';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Section, PageHeader } from '@/components/ui/Layout';
import { Card } from '@/components/ui';
import { COMPANY } from '@/lib/constants';

export default function RiskDisclaimer() {
  return (
    <>
      <Head>
        <title>Risk Disclaimer – {COMPANY.name}</title>
        <meta name="description" content="Important risk disclosures for Distributed Ledger Technology and software platform activities." />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="max-w-4xl mx-auto w-full">
        <Section>
          <PageHeader
            title="Risk Disclaimer"
            description="Important risk disclosures for Distributed Ledger Technology and software platform activities."
            icon={faExclamationTriangle}
            breadcrumbs={[{ label: 'Legal', href: '/legal' }, { label: 'Risk Disclaimer' }]}
          />

          <Card>
            <div className="space-y-8 text-text-secondary">

              <section>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6">
                  <h2 className="text-xl font-bold text-yellow-500 mb-3 flex items-center gap-3">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5" />
                    Important Risk Warning
                  </h2>
                  <p>Distributed Ledger Technology and software platform activities involve substantial risk of loss. You should carefully consider whether participating in DLT protocols is suitable for you in light of your financial circumstances and risk tolerance. <strong className="text-white">You may lose some or all of your invested capital.</strong></p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Market and Volatility Risks</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">Extreme Volatility:</strong> Digital asset prices can fluctuate dramatically within short periods</li>
                  <li><strong className="text-white">Market Manipulation:</strong> Digital asset markets may be subject to manipulation and artificial price movements</li>
                  <li><strong className="text-white">Liquidity Risks:</strong> You may not be able to exit positions quickly or at desired prices</li>
                  <li><strong className="text-white">Market Crashes:</strong> Digital asset markets can experience severe and prolonged downturns</li>
                  <li><strong className="text-white">Correlation Risks:</strong> Different digital assets may move together during market stress</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Technology and Smart Contract Risks</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">Smart Contract Vulnerabilities:</strong> Code bugs or exploits could result in loss of funds</li>
                  <li><strong className="text-white">Protocol Failures:</strong> DLT protocols may fail, be hacked, or operate incorrectly</li>
                  <li><strong className="text-white">Blockchain Network Issues:</strong> Network congestion, forks, or failures can affect transactions</li>
                  <li><strong className="text-white">Irreversible Transactions:</strong> Blockchain transactions cannot be reversed once confirmed</li>
                  <li><strong className="text-white">Key Management:</strong> Loss of private keys results in permanent loss of access to funds</li>
                  <li><strong className="text-white">Software Bugs:</strong> Platform or wallet software may contain critical vulnerabilities</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Regulatory and Legal Risks</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">Regulatory Changes:</strong> New laws or regulations could restrict or prohibit crypto activities</li>
                  <li><strong className="text-white">Tax Implications:</strong> Crypto transactions may have complex and changing tax consequences</li>
                  <li><strong className="text-white">Legal Uncertainty:</strong> The legal status of cryptocurrencies varies by jurisdiction</li>
                  <li><strong className="text-white">Compliance Requirements:</strong> You may be subject to reporting or compliance obligations</li>
                  <li><strong className="text-white">Enforcement Actions:</strong> Regulators may take action against crypto platforms or users</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Operational and Platform Risks</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">Platform Downtime:</strong> Our platform may be temporarily unavailable</li>
                  <li><strong className="text-white">Data Loss:</strong> Technical failures could result in loss of transaction data</li>
                  <li><strong className="text-white">Cybersecurity Threats:</strong> Hacking attempts and security breaches are ongoing risks</li>
                  <li><strong className="text-white">Third-Party Dependencies:</strong> We rely on external services that may fail or change</li>
                  <li><strong className="text-white">Network Congestion:</strong> High blockchain usage can cause delays and high fees</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Financial and Investment Risks</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">Total Loss:</strong> You may lose your entire investment</li>
                  <li><strong className="text-white">Impermanent Loss:</strong> Liquidity provision can result in losses vs. holding assets</li>
                  <li><strong className="text-white">Yield Variability:</strong> Returns from DeFi protocols can fluctuate significantly</li>
                  <li><strong className="text-white">Slippage:</strong> Large transactions may not execute at expected prices</li>
                  <li><strong className="text-white">Gas Fees:</strong> Transaction costs can be high and unpredictable</li>
                  <li><strong className="text-white">Opportunity Cost:</strong> Funds locked in protocols cannot be used elsewhere</li>
                </ul>
              </section>

              <section>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-6">
                  <h2 className="text-xl font-bold text-orange-500 mb-3">Protocol Disclaimer</h2>
                  <p className="font-medium"><strong className="text-white">Wrytes.io focuses on providing software development tools and accurate data for Distributed Ledger Technology protocols. We do not audit or endorse protocols — users must conduct their own due diligence.</strong></p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">No Financial Advice</h2>
                <p className="mb-3 font-semibold text-white">{COMPANY.name} does not provide financial, investment, or trading advice.</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>All information is for educational and informational purposes only</li>
                  <li>We do not recommend any specific investments or trading strategies</li>
                  <li>Past performance does not guarantee future results</li>
                  <li>You should consult with qualified financial advisors before making investment decisions</li>
                  <li>We are not responsible for your investment decisions or their outcomes</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Your Responsibilities</h2>
                <p className="mb-3">Before using our platform or engaging in any DLT activities, you must:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Understand the risks involved and accept full responsibility for your decisions</li>
                  <li>Only invest what you can afford to lose completely</li>
                  <li>Conduct your own research and due diligence</li>
                  <li>Ensure compliance with all applicable laws in your jurisdiction</li>
                  <li>Maintain proper security practices for your wallets and accounts</li>
                  <li>Stay informed about regulatory developments in your area</li>
                  <li>Consider seeking professional financial and legal advice</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">No Guarantees or Warranties</h2>
                <p className="mb-3">{COMPANY.name} makes no guarantees or warranties regarding:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>The performance, profitability, or success of any investment or strategy</li>
                  <li>The availability, functionality, or reliability of our platform</li>
                  <li>The accuracy, completeness, or timeliness of any information provided</li>
                  <li>The security or protection of your funds or data</li>
                  <li>Compliance with future regulatory requirements</li>
                  <li>The continued operation of third-party protocols or services</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Jurisdiction-Specific Considerations</h2>
                <p className="mb-3">Digital asset regulations vary significantly by jurisdiction. You are responsible for understanding and complying with all applicable laws, including:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Digital asset interaction and ownership restrictions</li>
                  <li>Tax reporting and payment obligations</li>
                  <li>Anti-money laundering (AML) requirements</li>
                  <li>Know Your Customer (KYC) compliance</li>
                  <li>Securities laws and investment regulations</li>
                  <li>Consumer protection requirements</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Acceptance of Risk</h2>
                <p className="mb-2 font-semibold text-white">By using our platform, you acknowledge that you have read, understood, and accepted all the risks outlined in this disclaimer.</p>
                <p>You confirm that you are using our services at your own risk and that you will not hold {COMPANY.name}, its officers, directors, employees, or affiliates liable for any losses you may incur.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Questions or Concerns</h2>
                <p className="mb-3">If you have questions about these risk disclosures:</p>
                <div className="bg-dark-surface p-4 rounded-lg text-sm">
                  <p><strong className="text-white">Email:</strong> hello@wrytes.io</p>
                  <p><strong className="text-white">Subject:</strong> Risk Disclaimer Inquiry</p>
                </div>
              </section>

              <section className="pt-6 border-t border-dark-surface">
                <p className="text-xs">Last updated: October 26, 2025</p>
              </section>
            </div>
          </Card>
        </Section>
      </div>
    </>
  );
}
