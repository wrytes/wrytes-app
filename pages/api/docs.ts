import type { NextApiRequest, NextApiResponse } from 'next';
import * as fs from 'fs';
import * as path from 'path';

export interface DocEntry {
  filename: string;       // bare filename without extension
  folder: string | null;  // immediate parent folder name, null for root
  path: string;           // full relative path without extension: "folder/sub/filename" or "filename"
  title: string;
  tags: string[];
  description: string;
}

export interface DocsApiResponse {
  entries: DocEntry[];
  folders: string[];
}

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
      result.tags = inner.split(',').map((t) => t.trim()).filter(Boolean);
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
  folders: Set<string>,
) {
  if (!fs.existsSync(dirPath)) return;

  for (const item of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const fullPath = path.join(dirPath, item.name);
    const relDir = path.relative(docsRoot, dirPath);
    const folder = relDir === '' ? null : relDir.split(path.sep)[0];

    if (item.isFile() && item.name.endsWith('.md')) {
      const filename = item.name.slice(0, -3);
      const relPath = relDir === '' ? filename : `${relDir.replace(/\\/g, '/')}/${filename}`;
      const content = fs.readFileSync(fullPath, 'utf-8');
      const { tags, description } = parseFrontmatter(content);
      entries.push({ filename, folder, path: relPath, title: titleFromFilename(filename), tags, description });
    }

    if (item.isDirectory()) {
      const folderRelPath = path.relative(docsRoot, fullPath).replace(/\\/g, '/');
      folders.add(folderRelPath.split('/')[0]);
      scanRecursive(fullPath, docsRoot, entries, folders);
    }
  }
}

export default function handler(_req: NextApiRequest, res: NextApiResponse<DocsApiResponse>) {
  const docsPath = path.join(process.cwd(), 'docs');
  const entries: DocEntry[] = [];
  const folders = new Set<string>();

  try {
    scanRecursive(docsPath, docsPath, entries, folders);
  } catch {
    return res.status(200).json({ entries: [], folders: [] });
  }

  return res.status(200).json({ entries, folders: [...folders].sort() });
}
