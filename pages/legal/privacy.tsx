import Head from 'next/head';
import { faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import { Section, PageHeader } from '@/components/ui/Layout';
import { Card } from '@/components/ui';
import { COMPANY } from '@/lib/constants';

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy – {COMPANY.name}</title>
        <meta name="description" content="Privacy policy for Wrytes AG explaining how we collect, use, and protect your personal data." />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="max-w-4xl mx-auto w-full">
        <Section>
          <PageHeader
            title="Privacy Policy"
            description="How we collect, use, and protect your personal data in compliance with Swiss Data Protection Act and GDPR."
            icon={faShieldAlt}
            breadcrumbs={[{ label: 'Legal', href: '/legal' }, { label: 'Privacy Policy' }]}
          />

          <Card>
            <div className="space-y-8 text-text-secondary">

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Data Controller</h2>
                <p className="mb-3">The data controller responsible for processing your personal data is:</p>
                <div className="bg-dark-surface p-4 rounded-lg text-sm">
                  <p><strong className="text-white">{COMPANY.name}</strong></p>
                  <p>{COMPANY.address}</p>
                  <p>Email: hello@wrytes.io</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Data We Collect</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-white mb-2">Automatically Collected Data</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>IP address and location data</li>
                      <li>Browser type and version</li>
                      <li>Operating system</li>
                      <li>Website usage patterns and analytics</li>
                      <li>Device information</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white mb-2">Wallet Connection Data</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Wallet addresses (public keys only)</li>
                      <li>Transaction signatures for authentication</li>
                      <li>Blockchain transaction history (public data)</li>
                      <li>Network preferences (Ethereum, Base, etc.)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white mb-2">Communication Data</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Email addresses when you contact us</li>
                      <li>Correspondence and support requests</li>
                      <li>Feedback and survey responses</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">How We Use Your Data</h2>
                <p className="mb-3">We process your personal data for the following purposes:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">Platform Operation:</strong> To provide and maintain our software development platform for DLT solutions</li>
                  <li><strong className="text-white">Authentication:</strong> To verify your identity through wallet signatures</li>
                  <li><strong className="text-white">Security:</strong> To protect against fraud, abuse, and security threats</li>
                  <li><strong className="text-white">Analytics:</strong> To understand usage patterns and improve our services</li>
                  <li><strong className="text-white">Communication:</strong> To respond to inquiries and provide support</li>
                  <li><strong className="text-white">Legal Compliance:</strong> To comply with applicable laws and regulations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Legal Basis for Processing</h2>
                <p className="mb-3">We process your personal data based on the following legal grounds:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">Legitimate Interest:</strong> For platform operation, security, and analytics</li>
                  <li><strong className="text-white">Consent:</strong> For cookies and optional data collection</li>
                  <li><strong className="text-white">Legal Obligation:</strong> For compliance with Swiss and EU regulations</li>
                  <li><strong className="text-white">Contract Performance:</strong> To provide requested services</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Data Sharing and Third Parties</h2>
                <p className="mb-3">We may share your data with the following third parties:</p>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-base font-semibold text-white mb-2">Service Providers</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Hosting and infrastructure providers</li>
                      <li>Analytics services</li>
                      <li>Security and monitoring services</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white mb-2">Blockchain Networks</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Transaction data is publicly visible on blockchain networks</li>
                      <li>Smart contract interactions are transparent and immutable</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white mb-2">Legal Requirements</h3>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Law enforcement when legally required</li>
                      <li>Regulatory authorities for compliance purposes</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Data Retention</h2>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">Usage Data:</strong> 24 months for analytics purposes</li>
                  <li><strong className="text-white">Authentication Data:</strong> Until account deletion or 7 years for compliance</li>
                  <li><strong className="text-white">Communication Data:</strong> 3 years for support and legal purposes</li>
                  <li><strong className="text-white">Blockchain Data:</strong> Permanently stored on public blockchains</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Your Rights</h2>
                <p className="mb-3">Under Swiss Data Protection Act and GDPR, you have the following rights:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">Access:</strong> Request information about your personal data</li>
                  <li><strong className="text-white">Rectification:</strong> Correct inaccurate personal data</li>
                  <li><strong className="text-white">Erasure:</strong> Request deletion of your personal data</li>
                  <li><strong className="text-white">Portability:</strong> Receive your data in a structured format</li>
                  <li><strong className="text-white">Restriction:</strong> Limit processing of your data</li>
                  <li><strong className="text-white">Objection:</strong> Object to processing based on legitimate interest</li>
                  <li><strong className="text-white">Withdraw Consent:</strong> Revoke consent for consent-based processing</li>
                </ul>
                <p className="mt-3">To exercise these rights, please contact us at hello@wrytes.io.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Cookies and Tracking</h2>
                <p className="mb-3">We use cookies and similar technologies to improve your experience. Essential cookies are required for platform functionality.</p>
                <h3 className="text-base font-semibold text-white mb-2">Cookie Types</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><strong className="text-white">Essential:</strong> Required for basic platform functionality</li>
                  <li><strong className="text-white">Analytics:</strong> Help us understand usage patterns</li>
                  <li><strong className="text-white">Preferences:</strong> Remember your settings and choices</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Data Security</h2>
                <p className="mb-3">We implement appropriate technical and organizational measures including:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security assessments and updates</li>
                  <li>Access controls and authentication measures</li>
                  <li>Employee training on data protection</li>
                  <li>Incident response procedures</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">International Data Transfers</h2>
                <p className="mb-3">When transferring data internationally, we ensure adequate protection through:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>European Commission adequacy decisions</li>
                  <li>Standard contractual clauses</li>
                  <li>Other appropriate safeguards</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Contact and Complaints</h2>
                <p className="mb-3">For questions about this privacy policy or to exercise your rights:</p>
                <div className="bg-dark-surface p-4 rounded-lg text-sm">
                  <p><strong className="text-white">Email:</strong> hello@wrytes.io</p>
                  <p><strong className="text-white">Subject:</strong> Privacy Inquiry</p>
                </div>
                <p className="mt-3">If you believe we have not adequately addressed your concerns, you have the right to lodge a complaint with the Swiss Federal Data Protection and Information Commissioner (FDPIC).</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-white mb-3">Changes to This Policy</h2>
                <p>We may update this privacy policy from time to time. We will notify you of any material changes by posting the new policy on this page.</p>
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
