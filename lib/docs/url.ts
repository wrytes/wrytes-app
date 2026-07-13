import type { DocEntry } from '@/lib/docs/scan';

export function docUrl(entry: Pick<DocEntry, 'path'>): string {
  return '/docs/' + entry.path.split('/').map(encodeURIComponent).join('/');
}
