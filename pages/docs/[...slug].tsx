import Head from 'next/head';
import { useRouter } from 'next/router';
import * as fs from 'fs';
import * as path from 'path';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { PageHeader, Section } from '@/components/ui/Layout';
import Card from '@/components/ui/Card';
import MarkdownContent from '@/components/ui/MarkdownContent';
import { ButtonInput } from '@/components/ui/Input';

interface DocsViewerPageProps {
  fileExists: boolean;
  slugPath: string;
  fileContent: string | null;
}

export default function DocsViewerPage({ fileExists, slugPath, fileContent }: DocsViewerPageProps) {
  const router = useRouter();
  const segments = slugPath.split('/');
  const filename = segments[segments.length - 1];
  const folderSegments = segments.slice(0, -1);
  const displayName = filename.split('_').slice(1).join(' ') || filename;

  const breadcrumbs = [
    { label: 'Documentation', href: '/docs' },
    ...folderSegments.map((f, i) => ({
      label: f.charAt(0).toUpperCase() + f.slice(1),
      href: '/docs?folder=' + segments.slice(0, i + 1).map(encodeURIComponent).join('/'),
    })),
    { label: displayName },
  ];

  return (
    <>
      <Head>
        <title>{displayName || 'Document'} — Wrytes Docs</title>
      </Head>

      <Section>
        <PageHeader
          title={fileExists ? displayName : 'Document Not Found'}
          description={!fileExists ? `No document found at path: "${slugPath}"` : undefined}
          icon={faBook}
          breadcrumbs={breadcrumbs}
          actions={
            <ButtonInput
              label="Browse Docs"
              variant="secondary"
              icon={<FontAwesomeIcon icon={faArrowLeft} />}
              onClick={() => router.push('/docs')}
            />
          }
        />

        <Card className="w-full overflow-x-auto">
          {fileExists ? (
            <MarkdownContent content={fileContent} />
          ) : (
            <p className="text-text-secondary">
              File <span className="text-white font-semibold">{slugPath}</span> does not exist in
              the docs directory.
            </p>
          )}
        </Card>
      </Section>
    </>
  );
}

export async function getServerSideProps(context: { query: { slug?: string[] } }) {
  const slugSegments = context.query?.slug ?? [];
  const slugPath = slugSegments.join('/');

  const props: DocsViewerPageProps = {
    fileExists: false,
    slugPath,
    fileContent: null,
  };

  const filePath = path.join(process.cwd(), 'docs', ...slugSegments) + '.md';

  try {
    if (fs.existsSync(filePath)) {
      props.fileExists = true;
      const raw = fs.readFileSync(filePath, 'utf-8') || '';
      if (raw.startsWith('---')) {
        const end = raw.indexOf('\n---', 3);
        props.fileContent = end !== -1 ? raw.slice(end + 4).trim() : raw;
      } else {
        props.fileContent = raw;
      }
    }
  } catch {
    // file not accessible
  }

  return { props };
}
