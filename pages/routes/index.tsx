import Head from 'next/head';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSliders,
  faArrowRightToBracket,
  faArrowRightFromBracket,
  faTriangleExclamation,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { useKrakenCredentials } from '@/hooks/redux/useKrakenCredentials';
import Card from '@/components/ui/Card';
import { Section } from '@/components/ui/layout';
import ButtonInput from '@/components/ui/input/ButtonInput';

function SetupRequired() {
  return (
    <Section title="Setup Required" description="Configure your Kraken account to start using onramp and offramp routes." padding="lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Primary CTA */}
        <Card className="md:col-span-1 border border-warning/30 bg-warning/5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center">
                <FontAwesomeIcon icon={faTriangleExclamation} className="w-4 h-4 text-warning" />
              </div>
              <div>
                <p className="font-semibold text-text-primary text-sm">Kraken credentials</p>
                <p className="text-xs text-text-muted">Not configured</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary">
              Add your Kraken API key and secret to enable automated fiat conversion routes.
            </p>
            <ButtonInput
              label="Go to Settings"
              href="/routes/settings"
              variant="primary"
              size="sm"
              icon={<FontAwesomeIcon icon={faSliders} className="w-3.5 h-3.5" />}
            />
          </div>
        </Card>

        {/* Onramp shortcut */}
        <Card className="border border-surface hover:border-brand/30 transition-colors" hover>
          <Link href="/routes/onramp" className="flex flex-col gap-3 h-full">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center">
                <FontAwesomeIcon icon={faArrowRightToBracket} className="w-4 h-4 text-brand" />
              </div>
              <div>
                <p className="font-semibold text-text-primary text-sm">Onramp</p>
                <p className="text-xs text-text-muted">Fiat → Crypto</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary flex-1">
              Configure routes that convert fiat deposits into on-chain assets.
            </p>
            <span className="text-brand text-xs font-medium flex items-center gap-1">
              View routes <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
            </span>
          </Link>
        </Card>

        {/* Offramp shortcut */}
        <Card className="border border-surface hover:border-brand/30 transition-colors" hover>
          <Link href="/routes/offramp" className="flex flex-col gap-3 h-full">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center">
                <FontAwesomeIcon icon={faArrowRightFromBracket} className="w-4 h-4 text-brand" />
              </div>
              <div>
                <p className="font-semibold text-text-primary text-sm">Offramp</p>
                <p className="text-xs text-text-muted">Crypto → Fiat</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary flex-1">
              Manage routes that convert on-chain tokens to fiat bank transfers via Kraken.
            </p>
            <span className="text-brand text-xs font-medium flex items-center gap-1">
              View routes <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
            </span>
          </Link>
        </Card>
      </div>
    </Section>
  );
}

function Overview() {
  return (
    <Section title="Routes Overview" description="Manage your onramp and offramp conversion routes." padding="lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-surface hover:border-brand/30 transition-colors" hover>
          <Link href="/routes/onramp" className="flex flex-col gap-3 h-full">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center">
                <FontAwesomeIcon icon={faArrowRightToBracket} className="w-4 h-4 text-brand" />
              </div>
              <div>
                <p className="font-semibold text-text-primary text-sm">Onramp</p>
                <p className="text-xs text-text-muted">Fiat → Crypto</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary flex-1">
              Configure routes that convert fiat deposits into on-chain assets.
            </p>
            <span className="text-brand text-xs font-medium flex items-center gap-1">
              Manage <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
            </span>
          </Link>
        </Card>

        <Card className="border border-surface hover:border-brand/30 transition-colors" hover>
          <Link href="/routes/offramp" className="flex flex-col gap-3 h-full">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center">
                <FontAwesomeIcon icon={faArrowRightFromBracket} className="w-4 h-4 text-brand" />
              </div>
              <div>
                <p className="font-semibold text-text-primary text-sm">Offramp</p>
                <p className="text-xs text-text-muted">Crypto → Fiat</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary flex-1">
              Manage routes that convert on-chain tokens to fiat bank transfers via Kraken.
            </p>
            <span className="text-brand text-xs font-medium flex items-center gap-1">
              Manage <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
            </span>
          </Link>
        </Card>
      </div>
    </Section>
  );
}

export default function RoutesIndexPage() {
  const { isConfigured } = useKrakenCredentials();

  return (
    <>
      <Head>
        <title>Routes – Wrytes</title>
      </Head>
      {isConfigured ? <Overview /> : <SetupRequired />}
    </>
  );
}
