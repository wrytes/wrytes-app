import Head from 'next/head';
import { faFileContract } from '@fortawesome/free-solid-svg-icons';
import { Section } from '@/components/ui/Layout';
import { PageHeader } from '@/components/ui/Layout';
import { Card } from '@/components/ui';
import { COMPANY } from '@/lib/constants';

export default function LegalNotice() {
  return (
    <>
      <Head>
        <title>Legal Notice – {COMPANY.name}</title>
        <meta name="description" content="Legal notice and company information for Wrytes AG as required by Swiss law." />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="max-w-4xl mx-auto w-full">
        <Section>
          <PageHeader
            title="Legal Notice"
            description="Company information and legal requirements as per Swiss Federal Act on Unfair Competition (UCA)."
            icon={faFileContract}
            breadcrumbs={[{ label: 'Legal', href: '/legal' }, { label: 'Legal Notice' }]}
          />

          <Card>
            <div className="space-y-8 text-text-secondary">

              <section>
                <h2 className="text-xl font-bold text-text-primary mb-3">Company Information</h2>
                <div className="space-y-2">
                  <p><strong className="text-text-primary">Company Name:</strong> {COMPANY.name}</p>
                  <p>
                    <strong className="text-text-primary">Company ID:</strong>{' '}
                    <a href={COMPANY.registry} target="_blank" rel="noopener noreferrer"
                      className="text-brand hover:text-brand/80 transition-colors underline">
                      {COMPANY.uid}
                    </a>
                  </p>
                  <p><strong className="text-text-primary">Legal Form:</strong> Aktiengesellschaft (AG)</p>
                  <p><strong className="text-text-primary">Registered Address:</strong> {COMPANY.address}</p>
                  <p><strong className="text-text-primary">Email:</strong> hello@wrytes.io</p>
                  <p><strong className="text-text-primary">Website:</strong> wrytes.io</p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-text-primary mb-3">Business Activities</h2>
                <p className="mb-3">Wrytes AG is a Swiss research and development company specializing in software development for Distributed Ledger Technologies and AI. Our core business activities include:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Software development and Distributed Ledger Technology solutions</li>
                  <li>Full-stack development from smart contracts to APIs and applications</li>
                  <li>Protocol adapters and system integrations</li>
                  <li>Technical consulting and development services for clients and partners</li>
                  <li>Platform development and innovation for cutting-edge technology research</li>
                  <li>Proprietary Asset Management (funding R&D operations)</li>
                  <li>Strategic partnerships and technology sharing agreements</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-text-primary mb-3">Regulatory Information</h2>
                <p className="mb-3">Wrytes AG operates in compliance with Swiss law and regulations, including:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Swiss Federal Act on Unfair Competition (UCA)</li>
                  <li>Swiss Data Protection Act (DPA)</li>
                  <li>Swiss Anti-Money Laundering Act (AMLA)</li>
                  <li>Swiss Distributed Ledger Technology (DLT) Act</li>
                  <li>Applicable FINMA guidelines and regulations</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-text-primary mb-3">Limitation of Liability</h2>
                <p className="mb-2">The information provided on this website is for general informational purposes only. While we strive to keep the information accurate and up-to-date, we make no representations or warranties of any kind about the completeness, accuracy, reliability, or availability of the information.</p>
                <p>Wrytes AG shall not be liable for any direct, indirect, incidental, special, or consequential damages arising from the use of this website or the information contained herein.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-text-primary mb-3">Intellectual Property</h2>
                <p>All content on this website, including but not limited to text, graphics, logos, images, and software, is the property of Wrytes AG or its licensors and is protected by Swiss and international copyright and trademark laws.</p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-text-primary mb-3">Legal Inquiries</h2>
                <p className="mb-3">For legal inquiries, compliance questions, or other formal communications:</p>
                <div className="bg-surface p-4 rounded-lg text-sm">
                  <p><strong className="text-text-primary">Email:</strong> hello@wrytes.io</p>
                  <p><strong className="text-text-primary">Subject:</strong> Legal Inquiry</p>
                </div>
              </section>

              <section className="pt-6 border-t border-surface">
                <p className="text-xs text-text-secondary">Last updated: October 26, 2025</p>
              </section>
            </div>
          </Card>
        </Section>
      </div>
    </>
  );
}
