import type { RunStatus, SessionStatus } from './client';

export const RUN_STATUS_BADGE: Record<RunStatus, { color: string; bg: string }> = {
  ACTIVE:    { color: 'text-success',      bg: 'bg-success/20' },
  PAUSED:    { color: 'text-yellow-400',   bg: 'bg-yellow-400/20' },
  STOPPED:   { color: 'text-text-muted',   bg: 'bg-surface' },
  COMPLETED: { color: 'text-info',         bg: 'bg-info/20' },
  ERROR:     { color: 'text-error',        bg: 'bg-error/20' },
};

export const SESSION_STATUS_BADGE: Record<SessionStatus, { color: string; bg: string }> = {
  QUEUED:    { color: 'text-yellow-400',   bg: 'bg-yellow-400/20' },
  RUNNING:   { color: 'text-info',         bg: 'bg-info/20' },
  COMPLETED: { color: 'text-success',      bg: 'bg-success/20' },
  FAILED:    { color: 'text-error',        bg: 'bg-error/20' },
  CANCELLED: { color: 'text-text-muted',   bg: 'bg-surface' },
};

export function fmt(n: number | string | undefined | null, decimals = 4): string {
  if (n == null || n === '') return '—';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(num)) return '—';
  return num.toFixed(decimals);
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
