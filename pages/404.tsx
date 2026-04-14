import Head from 'next/head';
import { useRouter } from 'next/router';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { Section, PageHeader } from '@/components/ui/Layout';
import { ButtonInput } from '@/components/ui/Input';
import { Card } from '@/components/ui';

export default function Custom404() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>404 – Page Not Found</title>
      </Head>

      <div className="w-full max-w-md">
        <Section className="flex flex-col items-center gap-4">
          <Card>
            <div className="space-y-4">
              <PageHeader
                title="404"
                description=" This page may have been moved or removed. Check the URL or head back to a known
                location."
                icon={faExclamationCircle}
              />

              <ButtonInput
                label="Return Home"
                variant="primary"
                onClick={() => router.push('/')}
                className="w-full"
              />
            </div>
          </Card>
        </Section>
      </div>
    </>
  );
}
