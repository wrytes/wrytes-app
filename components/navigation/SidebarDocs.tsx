import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFile,
  faArrowLeft,
  faBook,
  faFolder,
  faFolderOpen,
  faChevronDown,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';
import { docUrl } from '@/lib/docs/url';
import type { DocEntry, DocsApiResponse } from '@/pages/api/docs';

interface SidebarDocsProps {
  onItemClick: () => void;
  variant: 'desktop' | 'mobile';
}

export function SidebarDocs({ onItemClick, variant }: SidebarDocsProps) {
  const router = useRouter();
  const [data, setData] = useState<DocsApiResponse>({ entries: [], folders: [] });
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Current active path from catch-all slug
  const slugArr = Array.isArray(router.query.slug)
    ? router.query.slug
    : router.query.slug
      ? [router.query.slug]
      : [];
  const currentPath = slugArr.join('/');

  const activeFolder = Array.isArray(router.query.folder)
    ? router.query.folder[0]
    : router.query.folder;

  useEffect(() => {
    fetch('/api/docs')
      .then(r => r.json())
      .then((d: DocsApiResponse) => {
        setData(d);
        // Auto-expand folder of the currently viewed file
        if (slugArr.length > 1) {
          setExpandedFolders(prev => new Set([...prev, slugArr[0]]));
        }
        if (activeFolder) {
          setExpandedFolders(prev => new Set([...prev, activeFolder]));
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFolder = (folder: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folder)) next.delete(folder);
      else next.add(folder);
      return next;
    });
  };

  const linkClass = (active: boolean) =>
    cn(
      'flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm w-full',
      active
        ? 'text-brand bg-brand/20'
        : 'text-text-secondary hover:text-brand hover:bg-brand/20 hover:shadow-sm'
    );

  const rootFiles = data.entries.filter(e => e.folder === null);

  // Build folder tree: top-level folders → their entries (may have sub-folders)
  const folderTree = data.folders.map(folder => ({
    name: folder,
    entries: data.entries.filter(e => e.folder === folder),
  }));

  function renderFile(file: DocEntry, indent = false) {
    const isActive = currentPath === file.path;
    return (
      <Link
        key={file.path}
        href={docUrl(file)}
        className={cn(linkClass(isActive), indent && 'pl-6')}
        onClick={onItemClick}
      >
        <FontAwesomeIcon
          icon={faFile}
          className={cn('flex-shrink-0', indent ? 'w-3 h-3' : 'w-4 h-4')}
        />
        <span className="truncate">{file.title}</span>
      </Link>
    );
  }

  const navContent = (
    <>
      {/* All docs */}
      <Link
        href="/docs"
        className={linkClass(router.pathname === '/docs' && !activeFolder)}
        onClick={onItemClick}
      >
        <FontAwesomeIcon icon={faBook} className="w-4 h-4" />
        <span className="font-medium">All Documents</span>
      </Link>

      <div className="pt-2" />

      {/* Root files */}
      {rootFiles.length > 0 && (
        <>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary px-4 mt-6 mb-2">
            Documents
          </p>
          {rootFiles.map(file => renderFile(file))}
        </>
      )}

      <div className="pt-2" />

      {/* Folders */}
      {folderTree.length > 0 && (
        <>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary px-4 mt-6 mb-2">
            Folders
          </p>
          {folderTree.map(({ name, entries }) => {
            const isExpanded = expandedFolders.has(name);
            const isFolderActive = activeFolder === name;

            return (
              <div key={name}>
                <div className={cn(linkClass(isFolderActive), 'pr-2')}>
                  <Link
                    href={`/docs?folder=${encodeURIComponent(name)}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                    onClick={onItemClick}
                  >
                    <FontAwesomeIcon
                      icon={isExpanded ? faFolderOpen : faFolder}
                      className="w-4 h-4 flex-shrink-0"
                    />
                    <span className="truncate capitalize">{name}</span>
                  </Link>
                  {entries.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleFolder(name)}
                      className="flex-shrink-0 hover:text-brand transition-colors"
                    >
                      <FontAwesomeIcon
                        icon={isExpanded ? faChevronDown : faChevronRight}
                        className="w-3 h-3"
                      />
                    </button>
                  )}
                </div>

                {isExpanded && entries.length > 0 && (
                  <div className="ml-4 border-l border-surface pl-2 space-y-1 mt-1 mb-2">
                    {entries.map(file => renderFile(file, true))}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </>
  );

  if (variant === 'mobile') return <nav className="space-y-2">{navContent}</nav>;
  return <nav className="px-4 py-6 space-y-2">{navContent}</nav>;
}
