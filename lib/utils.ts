import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function sanitizeString(str: string): string {
  return str.replace(/[<>\"']/g, '');
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Convert an IPFS URI to an HTTP gateway URL
 * Supports ipfs:// protocol and raw CID strings
 */
export function ipfsToHttp(uri: string | null | undefined, gateway = 'https://ipfs.io/ipfs/'): string | null {
  if (!uri) return null;

  // Already an HTTP URL
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }

  // ipfs:// protocol
  if (uri.startsWith('ipfs://')) {
    const cid = uri.replace('ipfs://', '');
    return `${gateway}${cid}`;
  }

  // Raw CID (starts with Qm or bafy)
  if (uri.startsWith('Qm') || uri.startsWith('bafy')) {
    return `${gateway}${uri}`;
  }

  // Unknown format, return as-is
  return uri;
}