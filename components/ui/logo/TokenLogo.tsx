import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import { useTokenLogo } from '@/hooks/ui/useTokenLogo';

interface TokenLogoProps {
  logoURI?: string;
  currency?: string;
  size?: number;
  className?: string;
}

export function TokenLogo({ logoURI, currency, size = 8, className = '' }: TokenLogoProps) {
  const [failed, setFailed] = useState(false);
  const src = useTokenLogo(currency, logoURI);

  if (!src || failed) {
    return (
      <FontAwesomeIcon
        icon={faCircleQuestion}
        className={`w-${size} h-${size} text-text-secondary ${className}`}
      />
    );
  }

  return (
    <Image
      src={src}
      width={size * 4}
      height={size * 4}
      className={`w-${size} h-${size} rounded-full ${className}`}
      alt={currency ?? 'token'}
      onError={() => setFailed(true)}
    />
  );
}
