import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useMemo, useEffect } from 'react';
import * as path from 'path';
import { faBook, faFolder } from '@fortawesome/free-solid-svg-icons';
import { PageHeader, Section } from '@/components/ui/layout';
import {
  Badge,
  TagList,
  Grid,
  GridBody,
  GridHeader,
  GridItem,
  GridItemEmpty,
} from '@/components/ui';
import { scanDocs, type DocEntry } from '@/lib/docs/scan';
import { docUrl } from '@/lib/docs/url';
import { formatDate } from '@/lib/utils';

const SORT_OPTIONS = ['Date', 'Title'];

const STATUS_FILTERS = [
  { label: 'New', value: 'new' },
  { label: 'Published', value: 'published' },
  { label: 'Draft', value: 'draft' },
];

const STATUS_META: Record<DocEntry['status'], { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: 'text-brand', bg: 'bg-brand/10' },
  published: { label: 'Published', color: 'text-success', bg: 'bg-success-bg' },
  draft: { label: 'Draft', color: 'text-text-secondary', bg: 'bg-surface' },
};

interface DocsIndexPageProps {
  entries: DocEntry[];
}

function formatDocDate(date: string | null): string | null {
  if (!date) return null;
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return null;
  return formatDate(new Date(y, m - 1, d));
}

export default function DocsIndexPage({ entries }: DocsIndexPageProps) {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [sortTab, setSortTab] = useState('Date');
  const [sortReverse, setSortReverse] = useState(true);
  const [activeStatuses, setActiveStatuses] = useState<string[]>([]);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  // Sync folder from URL query
  useEffect(() => {
    const folder = Array.isArray(router.query.folder)
      ? router.query.folder[0]
      : (router.query.folder ?? null);
    setActiveFolder(folder);
  }, [router.query.folder]);

  const allTags = useMemo(() => [...new Set(entries.flatMap(e => e.tags))].sort(), [entries]);

  const filtered = useMemo(() => {
    let result = entries;

    if (activeFolder !== null) {
      result = result.filter(e => e.folder === activeFolder);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        e =>
          e.title.toLowerCase().includes(q) ||
          e.tags.some(t => t.toLowerCase().includes(q)) ||
          e.description.toLowerCase().includes(q) ||
          e.author.toLowerCase().includes(q)
      );
    }

    if (activeStatuses.length > 0) {
      result = result.filter(e => activeStatuses.includes(e.status));
    }

    if (activeTags.length > 0) {
      result = result.filter(e => activeTags.every(tag => e.tags.includes(tag)));
    }

    return [...result].sort((a, b) => {
      const cmp =
        sortTab === 'Date'
          ? (a.date ?? '').localeCompare(b.date ?? '')
          : a.title.localeCompare(b.title);
      return sortReverse ? -cmp : cmp;
    });
  }, [entries, search, activeStatuses, activeTags, activeFolder, sortTab, sortReverse]);

  const handleSortChange = (col: string) => {
    if (col === sortTab) setSortReverse(r => !r);
    else {
      setSortTab(col);
      setSortReverse(false);
    }
  };

  const folderLabel = activeFolder
    ? `${activeFolder.charAt(0).toUpperCase()}${activeFolder.slice(1)}`
    : null;

  return (
    <>
      <Head>
        <title>{folderLabel ? `${folderLabel} – Docs` : 'Documentation'} — Wrytes</title>
        <meta name="description" content="Wrytes platform documentation library" />
      </Head>

      <Section>
        <PageHeader
          title={folderLabel ? `${folderLabel}` : 'Document Library'}
          description={
            folderLabel
              ? `Browsing folder: ${folderLabel}`
              : 'Browse guides, research, and reference materials. Use search or filters to find what you need.'
          }
          icon={folderLabel ? faFolder : faBook}
          breadcrumbs={
            folderLabel
              ? [{ label: 'Documentation', href: '/docs' }, { label: folderLabel }]
              : undefined
          }
        />

        <Grid>
          <GridHeader
            searchPlaceholder="Search documents…"
            searchValue={search}
            onSearchChange={setSearch}
            hideMyWallet
            inMyWallet={false}
            onInMyWalletChange={() => {}}
            filterOptionsTitle="Status"
            filterOptions={STATUS_FILTERS}
            activeFilters={activeStatuses}
            onFiltersChange={setActiveStatuses}
            customCategories={allTags}
            customCategoriesTitle="Tags"
            activeCustomCategories={activeTags}
            onCustomCategoriesChange={setActiveTags}
            sortOptions={SORT_OPTIONS}
            tab={sortTab}
            reverse={sortReverse}
            tabOnChange={handleSortChange}
          />

          <GridBody>
            {filtered.length === 0 ? (
              <GridItemEmpty>No documents match your search.</GridItemEmpty>
            ) : (
              filtered.map(entry => {
                const meta = [entry.folder, formatDocDate(entry.date)].filter(Boolean).join(' · ');
                const status = STATUS_META[entry.status];

                return (
                  <GridItem
                    key={`${entry.folder ?? 'root'}/${entry.filename}`}
                    onClick={() => router.push(docUrl(entry))}
                    image={entry.image ? { src: entry.image, alt: entry.title } : undefined}
                    avatar={{ src: entry.avatar ?? undefined, label: entry.author }}
                    badge={
                      <Badge
                        text={status.label}
                        variant="custom"
                        customColor={status.color}
                        customBgColor={status.bg}
                      />
                    }
                    meta={meta || undefined}
                    subtitle={<Badge text={`by ${entry.author}`} />}
                    title={entry.title}
                    description={entry.description}
                    footer={<TagList tags={entry.tags} activeTags={activeTags} align="left" />}
                  />
                );
              })
            )}
          </GridBody>
        </Grid>
      </Section>
    </>
  );
}

// ── SSR ───────────────────────────────────────────────────────────────────────

export async function getServerSideProps() {
  const docsPath = path.join(process.cwd(), 'docs');
  const { entries } = scanDocs(docsPath);
  return { props: { entries } };
}
