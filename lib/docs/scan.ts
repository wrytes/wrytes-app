import * as fs from 'fs';
import * as path from 'path';

export interface DocEntry {
  filename: string; // bare filename without extension
  folder: string | null; // immediate parent folder name, null for root
  path: string; // full relative path without extension: "folder/sub/filename" or "filename"
  title: string;
  tags: string[];
  description: string;
  date: string | null;
  status: 'draft' | 'published' | 'new';
  author: string;
  avatar: string | null;
  image: string | null;
}

const DEFAULT_AUTHOR = 'Wrytes Team';

interface Frontmatter {
  title: string | null;
  tags: string[];
  description: string;
  date: string | null;
  status: 'draft' | 'published' | 'new';
  author: string | null;
  avatar: string | null;
  image: string | null;
}

function parseFrontmatter(content: string): Frontmatter {
  const result: Frontmatter = {
    title: null,
    tags: [],
    description: '',
    date: null,
    status: 'published',
    author: null,
    avatar: null,
    image: null,
  };

  if (!content.startsWith('---')) return result;
  const end = content.indexOf('\n---', 3);
  if (end === -1) return result;

  for (const line of content.slice(3, end).trim().split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim();
    const unquoted = val.replace(/^["']|["']$/g, '');

    switch (key) {
      case 'title':
        result.title = unquoted || null;
        break;
      case 'tags': {
        const inner = val.startsWith('[') && val.endsWith(']') ? val.slice(1, -1) : val;
        result.tags = inner
          .split(',')
          .map(t => t.trim())
          .filter(Boolean);
        break;
      }
      case 'description':
        result.description = unquoted;
        break;
      case 'date':
        result.date = unquoted || null;
        break;
      case 'status':
        result.status =
          unquoted === 'draft' ? 'draft' : unquoted === 'new' ? 'new' : 'published';
        break;
      case 'author':
        result.author = unquoted || null;
        break;
      case 'avatar':
        result.avatar = unquoted || null;
        break;
      case 'image':
        result.image = unquoted || null;
        break;
    }
  }

  return result;
}

function titleFromFilename(filename: string): string {
  return filename.split('_').slice(1).join(' ').trim() || filename;
}

export function scanDocs(docsRoot: string): { entries: DocEntry[]; folders: string[] } {
  const entries: DocEntry[] = [];
  const folders = new Set<string>();

  function scanRecursive(dirPath: string) {
    if (!fs.existsSync(dirPath)) return;

    for (const item of fs.readdirSync(dirPath, { withFileTypes: true })) {
      const fullPath = path.join(dirPath, item.name);
      const relDir = path.relative(docsRoot, dirPath).replace(/\\/g, '/');
      const folder = relDir === '' ? null : relDir.split('/')[0];

      if (item.isFile() && item.name.endsWith('.md')) {
        const filename = item.name.slice(0, -3);
        const relPath = relDir === '' ? filename : `${relDir}/${filename}`;
        const fm = parseFrontmatter(fs.readFileSync(fullPath, 'utf-8'));
        entries.push({
          filename,
          folder,
          path: relPath,
          title: fm.title || titleFromFilename(filename),
          tags: fm.tags,
          description: fm.description,
          date: fm.date,
          status: fm.status,
          author: fm.author || DEFAULT_AUTHOR,
          avatar: fm.avatar,
          image: fm.image,
        });
      }

      if (item.isDirectory()) {
        const folderRelPath = path.relative(docsRoot, fullPath).replace(/\\/g, '/');
        folders.add(folderRelPath.split('/')[0]);
        scanRecursive(fullPath);
      }
    }
  }

  try {
    scanRecursive(docsRoot);
  } catch {
    // docs dir not accessible
  }

  return { entries, folders: [...folders].sort() };
}
