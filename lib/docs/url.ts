import type { DocEntry } from '@/pages/api/docs';

export function docUrl(entry: Pick<DocEntry, 'path'>): string {
  return '/docs/' + entry.path.split('/').map(encodeURIComponent).join('/');
}
