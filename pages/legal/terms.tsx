import Head from 'next/head';
import { faGavel } from '@fortawesome/free-solid-svg-icons';
import { Section, PageHeader } from '@/components/ui/Layout';
import { Card } from '@/components/ui';
import { COMPANY } from '@/lib/constants';

export default function TermsOfService() {
  return (
    <>
      <Head>
        <title>Terms of Service – {COMPANY.name}</title>
        <meta name="description" content="Terms of Service for Wrytes AG platform and services." />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="max-w-4xl mx-auto w-full">
        <Section>
          <PageHeader
            title="Terms of Service"
            description="Terms and conditions for using the Wrytes AG platform and services."
            icon={faGavel}
            breadcrumbs={[{ label: 'Legal', href: '/legal' }, { label: 'Terms of Service' }]}
          />

          <Card>
            <div className="space-y-8 text-text-secondary">

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Agreement to Terms</h2>
                <p className="mb-2">By accessing and using the {COMPANY.name} platform and services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this platform.</p>
                <p>These terms constitute a legally binding agreement between you and {COMPANY.name}.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Service Description</h2>
                <p className="mb-3">Wrytes AG provides a software development platform specializing in Distributed Ledger Technology solutions and protocol integrations. Our services include:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Software development and Distributed Ledger Technology solutions</li>
                  <li>Protocol adapters and system integrations</li>
                  <li>Full-stack development from smart contracts to APIs and applications</li>
                  <li>Technical consulting and development services</li>
                  <li>Platform development and innovation tools</li>
                  <li>Research and development in cutting-edge technology</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Eligibility</h2>
                <p className="mb-3">To use our platform, you must:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Be at least 18 years of age</li>
                  <li>Have the legal capacity to enter into binding agreements</li>
                  <li>Not be prohibited from using our services under applicable laws</li>
                  <li>Comply with all local laws and regulations regarding cryptocurrency and DeFi</li>
                  <li>Provide accurate and complete information when required</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Account and Wallet Responsibilities</h2>
                <p className="mb-3">When using our platform, you are responsible for:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Maintaining the security of your cryptocurrency wallets and private keys</li>
                  <li>Ensuring the accuracy of all transaction data and addresses</li>
                  <li>Understanding the risks associated with blockchain transactions</li>
                  <li>Complying with all applicable laws in your jurisdiction</li>
                  <li>Not using the platform for any illegal or unauthorized purposes</li>
                  <li>Safeguarding your authentication credentials and access methods</li>
                </ul>
                <p className="mt-3 font-semibold text-white">We do not store private keys or have access to your funds. You are solely responsible for the security of your cryptocurrency assets.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Acceptable Use Policy</h2>
                <p className="mb-3">You agree not to use our platform to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Engage in any illegal activities or violate any applicable laws</li>
                  <li>Attempt to gain unauthorized access to our systems or other users&apos; accounts</li>
                  <li>Interfere with or disrupt the operation of our platform</li>
                  <li>Use our services for money laundering, terrorism financing, or other illicit activities</li>
                  <li>Manipulate markets or engage in fraudulent trading activities</li>
                  <li>Violate any intellectual property rights</li>
                  <li>Transmit malicious code, viruses, or other harmful content</li>
                  <li>Impersonate other individuals or entities</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Platform Availability</h2>
                <p className="mb-3">We strive to maintain high availability but cannot guarantee uninterrupted service. The platform may be temporarily unavailable due to:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Scheduled maintenance and updates</li>
                  <li>Unexpected technical issues or outages</li>
                  <li>Network congestion or blockchain-related delays</li>
                  <li>Security incidents or necessary protective measures</li>
                  <li>Force majeure events beyond our control</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Financial Disclaimers</h2>
                <p className="mb-3 font-semibold text-white">Important Financial Disclaimers:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>We do not provide financial, investment, or trading advice</li>
                  <li>All information is for educational and informational purposes only</li>
                  <li>Past performance does not guarantee future results</li>
                  <li>Cryptocurrency and DeFi activities involve significant financial risks</li>
                  <li>You may lose some or all of your invested capital</li>
                  <li>We are not responsible for investment decisions or outcomes</li>
                  <li>Always consult with qualified financial professionals before making investment decisions</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Limitation of Liability</h2>
                <p className="mb-3">To the maximum extent permitted by applicable law, {COMPANY.name} shall not be liable for:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Any direct, indirect, incidental, special, or consequential damages</li>
                  <li>Loss of profits, data, or other intangible losses</li>
                  <li>Damages resulting from blockchain network issues or delays</li>
                  <li>Smart contract vulnerabilities or protocol failures</li>
                  <li>Third-party service failures or security breaches</li>
                  <li>Market volatility or investment losses</li>
                  <li>Unauthorized access to your wallet or accounts</li>
                </ul>
                <p className="mt-3 font-semibold text-white">Our total liability to you for any claims shall not exceed the amount you paid to us for services in the 12 months preceding the claim.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Indemnification</h2>
                <p className="mb-3">You agree to indemnify and hold harmless {COMPANY.name}, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Your use of our platform or services</li>
                  <li>Your violation of these terms of service</li>
                  <li>Your violation of applicable laws or regulations</li>
                  <li>Your infringement of third-party rights</li>
                  <li>Your negligent or wrongful conduct</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Intellectual Property</h2>
                <p className="mb-3">All content, features, and functionality are owned by {COMPANY.name} or its licensors and are protected by intellectual property laws. You are granted a limited, non-exclusive, non-transferable license. You may not:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Copy, modify, or distribute our proprietary content</li>
                  <li>Reverse engineer or attempt to extract source code</li>
                  <li>Use our trademarks or branding without permission</li>
                  <li>Create derivative works based on our platform</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Termination</h2>
                <p className="mb-3">We reserve the right to terminate or suspend your access immediately, without prior notice, for any reason, including:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Violation of these terms of service</li>
                  <li>Suspected illegal or fraudulent activity</li>
                  <li>Security concerns or threats</li>
                  <li>Extended periods of inactivity</li>
                  <li>Technical or business reasons</li>
                </ul>
                <p className="mt-3">Upon termination, your right to use our platform ceases immediately. Provisions regarding liability, indemnification, and dispute resolution shall survive termination.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Governing Law and Jurisdiction</h2>
                <p>These terms are governed by and construed in accordance with the laws of Switzerland. Any disputes shall be subject to the exclusive jurisdiction of the courts in Zug, Switzerland.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Changes to Terms</h2>
                <p>We reserve the right to modify these terms at any time. Material changes will be notified through our platform or via email. Your continued use after changes become effective constitutes acceptance of the updated terms.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Contact Information</h2>
                <p className="mb-3">If you have questions about these terms:</p>
                <div className="bg-dark-surface p-4 rounded-lg text-sm">
                  <p><strong className="text-white">Email:</strong> hello@wrytes.io</p>
                  <p><strong className="text-white">Subject:</strong> Terms of Service Inquiry</p>
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
