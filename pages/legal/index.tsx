import Head from 'next/head';
import Link from 'next/link';
import {
  faFileContract,
  faGavel,
  faShieldAlt,
  faExclamationTriangle,
  faBalanceScale,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Section } from '@/components/ui/Layout';
import { PageHeader } from '@/components/ui/Layout';
import { Card } from '@/components/ui';
import { COMPANY } from '@/lib/constants';

const legalPages = [
  {
    title: 'Legal Notice',
    description: 'Company information and legal requirements as per Swiss law.',
    href: '/legal/notice',
    icon: faFileContract,
  },
  {
    title: 'Privacy Policy',
    description: 'How we collect, use, and protect your personal data.',
    href: '/legal/privacy',
    icon: faShieldAlt,
  },
  {
    title: 'Terms of Service',
    description: 'Terms and conditions for using our platform and services.',
    href: '/legal/terms',
    icon: faGavel,
  },
  {
    title: 'Risk Disclaimer',
    description: 'Important risk disclosures for DLT and software platform activities.',
    href: '/legal/disclaimer',
    icon: faExclamationTriangle,
  },
];

export default function LegalIndex() {
  return (
    <>
      <Head>
        <title>Legal – {COMPANY.name}</title>
        <meta
          name="description"
          content="Legal documents and compliance information for Wrytes AG."
        />
        <meta name="robots" content="index, follow" />
      </Head>

      <div className="max-w-4xl mx-auto w-full">
        <Section>
          <PageHeader
            title="Legal Information"
            description="Important legal documents and compliance information for Wrytes AG operations and services."
            icon={faBalanceScale}
          />

          <div className="grid md:grid-cols-2 gap-6">
            {legalPages.map(page => (
              <Link key={page.href} href={page.href}>
                <Card hover className="h-full group cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-accent-orange/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-accent-orange/30 transition-colors">
                      <FontAwesomeIcon icon={page.icon} className="w-5 h-5 text-accent-orange" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1 group-hover:text-accent-orange transition-colors">
                        {page.title}
                      </h3>
                      <p className="text-text-secondary text-sm leading-relaxed">
                        {page.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Section>

        <Section>
          <Card className="text-center">
            <h3 className="text-lg font-bold text-white mb-3">Contact Information</h3>
            <div className="space-y-1 text-text-secondary text-sm">
              <p>
                <strong className="text-white">{COMPANY.name}</strong>
              </p>
              <p>{COMPANY.address}</p>
              <p>Email: hello@wrytes.io</p>
            </div>
            <p className="text-text-secondary text-xs mt-4">
              For legal inquiries or compliance questions, please contact us directly.
            </p>
          </Card>
        </Section>
      </div>
    </>
  );
}
