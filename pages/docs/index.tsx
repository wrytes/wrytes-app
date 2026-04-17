import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useMemo, useEffect } from 'react';
import * as fs from 'fs';
import * as path from 'path';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook, faArrowRight, faFolder } from '@fortawesome/free-solid-svg-icons';
import { PageHeader, Section } from '@/components/ui/Layout';
import {
  Table,
  TableBody,
  TableHeadSearchable,
  TableRow,
  TableRowEmpty,
} from '@/components/ui/Table';
import { TagList } from '@/components/ui';
import type { DocEntry } from '@/pages/api/docs';
import { docUrl } from '@/lib/docs/url';

const HEADERS = ['Document', 'Tags'];
const COL_SPAN = 2;

interface DocsIndexPageProps {
  entries: DocEntry[];
  folders: string[];
}

export default function DocsIndexPage({ entries, folders }: DocsIndexPageProps) {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [sortTab, setSortTab] = useState('Document');
  const [sortReverse, setSortReverse] = useState(false);
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
          e.description.toLowerCase().includes(q)
      );
    }

    if (activeTags.length > 0) {
      result = result.filter(e => activeTags.every(tag => e.tags.includes(tag)));
    }

    return [...result].sort((a, b) => {
      const cmp =
        sortTab === 'Tags' ? a.tags.length - b.tags.length : a.title.localeCompare(b.title);
      return sortReverse ? -cmp : cmp;
    });
  }, [entries, search, activeTags, activeFolder, sortTab, sortReverse]);

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

        <Table>
          <TableHeadSearchable
            searchPlaceholder="Search documents…"
            searchValue={search}
            onSearchChange={setSearch}
            hideMyWallet
            inMyWallet={false}
            onInMyWalletChange={() => {}}
            filterOptions={[]}
            activeFilters={[]}
            onFiltersChange={() => {}}
            customCategories={allTags}
            customCategoriesTitle="Tags"
            activeCustomCategories={activeTags}
            onCustomCategoriesChange={setActiveTags}
            headers={HEADERS}
            colSpan={COL_SPAN}
            tab={sortTab}
            reverse={sortReverse}
            tabOnChange={handleSortChange}
          />
          <TableBody>
            {filtered.length === 0 ? (
              <TableRowEmpty>No documents match your search.</TableRowEmpty>
            ) : (
              filtered.map(entry => (
                <TableRow
                  key={`${entry.folder ?? 'root'}/${entry.filename}`}
                  headers={HEADERS}
                  tab={sortTab}
                  colSpan={COL_SPAN}
                  className="cursor-pointer"
                  actionCol={
                    <button
                      type="button"
                      onClick={() => router.push(docUrl(entry))}
                      className="flex items-center justify-end gap-2 w-full text-accent-orange hover:underline text-sm font-medium"
                    >
                      View
                      <FontAwesomeIcon icon={faArrowRight} className="w-3 h-3" />
                    </button>
                  }
                >
                  {/* Title */}
                  <div
                    className="cursor-pointer text-left"
                    onClick={() => router.push(docUrl(entry))}
                  >
                    <p className="font-semibold text-text-primary hover:text-white transition-colors">
                      {entry.title}
                    </p>
                    {entry.description && (
                      <p className="text-xs text-text-secondary mt-0.5 line-clamp-2 md:line-clamp-1 md:max-w-xs">
                        {entry.description}
                      </p>
                    )}
                    {entry.folder && (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs text-text-secondary">
                        <FontAwesomeIcon icon={faFolder} className="w-3 h-3" />
                        {entry.folder}
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex max-md:pt-8 max-md:pb-4">
                    <TagList tags={entry.tags} activeTags={activeTags} />
                  </div>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Section>
    </>
  );
}

// ── SSR ───────────────────────────────────────────────────────────────────────

function parseFrontmatter(content: string): { tags: string[]; description: string } {
  if (!content.startsWith('---')) return { tags: [], description: '' };
  const end = content.indexOf('\n---', 3);
  if (end === -1) return { tags: [], description: '' };
  const result = { tags: [] as string[], description: '' };
  for (const line of content.slice(3, end).trim().split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim();
    if (key === 'tags') {
      const inner = val.startsWith('[') && val.endsWith(']') ? val.slice(1, -1) : val;
      result.tags = inner
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
    } else if (key === 'description') {
      result.description = val.replace(/^["']|["']$/g, '');
    }
  }
  return result;
}

function titleFromFilename(filename: string): string {
  return filename.split('_').slice(1).join(' ').trim() || filename;
}

function scanRecursive(
  dirPath: string,
  docsRoot: string,
  entries: DocEntry[],
  folders: Set<string>
) {
  if (!fs.existsSync(dirPath)) return;
  for (const item of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, item.name);
    const relDir = path.relative(docsRoot, dirPath).replace(/\\/g, '/');
    const folder = relDir === '' ? null : relDir.split('/')[0];

    if (item.isFile() && item.name.endsWith('.md')) {
      const filename = item.name.slice(0, -3);
      const relPath = relDir === '' ? filename : `${relDir}/${filename}`;
      const { tags, description } = parseFrontmatter(fs.readFileSync(fullPath, 'utf-8'));
      entries.push({
        filename,
        folder,
        path: relPath,
        title: titleFromFilename(filename),
        tags,
        description,
      });
    }

    if (item.isDirectory()) {
      const folderRelPath = path.relative(docsRoot, fullPath).replace(/\\/g, '/');
      folders.add(folderRelPath.split('/')[0]);
      scanRecursive(fullPath, docsRoot, entries, folders);
    }
  }
}

export async function getServerSideProps() {
  const docsPath = path.join(process.cwd(), 'docs');
  const entries: DocEntry[] = [];
  const folders = new Set<string>();

  try {
    scanRecursive(docsPath, docsPath, entries, folders);
  } catch {
    // docs dir not accessible
  }

  return { props: { entries, folders: [...folders].sort() } };
}
