import { useState, useEffect } from 'react';
import { TOKENS } from '@/lib/tokens/config';
import { fetchCowTokenList } from '@/lib/tokens/cow-service';

/**
 * Resolves the best available logo URL for a token, in priority order:
 * 1. Explicit logoURI prop (caller-supplied)
 * 2. Static TOKENS registry (local assets, instant)
 * 3. CoW token list (async, cached in localStorage for 1h) — for unknown tokens
 * 4. Convention-based local path /coin/{symbol}.svg (while CoW loads)
 */
export function useTokenLogo(currency?: string, logoURIProp?: string): string | undefined {
  const getInitialSrc = (): string | undefined => {
    if (logoURIProp) return logoURIProp;
    if (!currency) return undefined;
    const t = TOKENS[currency] ?? TOKENS[currency.toUpperCase()];
    if (t?.logoURI) return t.logoURI;
    return `/coin/${currency.toLowerCase()}.svg`;
  };

  const [src, setSrc] = useState<string | undefined>(getInitialSrc);

  // Re-sync when props change
  useEffect(() => {
    setSrc(getInitialSrc());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency, logoURIProp]);

  // Async CoW lookup — only for tokens not already in the static registry
  useEffect(() => {
    if (logoURIProp || !currency) return;
    const t = TOKENS[currency] ?? TOKENS[currency.toUpperCase()];
    if (t?.logoURI) return; // already resolved locally

    let cancelled = false;
    fetchCowTokenList()
      .then((tokens) => {
        if (cancelled) return;
        const match = tokens.find((t) => t.symbol.toLowerCase() === currency.toLowerCase());
        if (match?.logoURI) setSrc(match.logoURI);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [currency, logoURIProp]);

  return src;
}
