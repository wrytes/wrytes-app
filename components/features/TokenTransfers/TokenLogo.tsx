import { useState } from 'react';
import { useTokenLogo } from '@/hooks/ui/useTokenLogo';

interface Props {
  symbol: string | null;
  size?: number; // px, default 20
}

export function TokenLogo({ symbol, size = 20 }: Props) {
  const [failed, setFailed] = useState(false);
  const src = useTokenLogo(symbol ?? undefined);
  const letter = (symbol ?? '?')[0].toUpperCase();

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={symbol ?? ''}
        width={size}
        height={size}
        onError={() => setFailed(true)}
        className="rounded-full flex-shrink-0 object-contain"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-surface border border-table-alt text-text-muted font-semibold flex-shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {letter}
    </span>
  );
}
