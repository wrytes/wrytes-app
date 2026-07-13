import type { NextApiRequest, NextApiResponse } from 'next';
import * as path from 'path';
import { scanDocs, type DocEntry } from '@/lib/docs/scan';

export type { DocEntry };

export interface DocsApiResponse {
  entries: DocEntry[];
  folders: string[];
}

export default function handler(_req: NextApiRequest, res: NextApiResponse<DocsApiResponse>) {
  const docsPath = path.join(process.cwd(), 'docs');
  const { entries, folders } = scanDocs(docsPath);
  return res.status(200).json({ entries, folders });
}
