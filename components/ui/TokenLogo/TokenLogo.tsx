import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';

interface TokenLogoProps {
  logoURI?: string;
  currency?: string;
  size?: number;
  className?: string;
}

export const TokenLogo: React.FC<TokenLogoProps> = ({
  logoURI,
  currency,
  size = 8,
  className = '',
}) => {
  const [failed, setFailed] = useState(false);

  // Use logoURI if provided, otherwise try local path
  const src = logoURI || (currency ? `/coin/${currency.toLowerCase()}.svg` : undefined);

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
      className={`w-${size} h-${size} rounded-full ${className}`}
      alt={currency ?? 'token'}
      onError={() => setFailed(true)}
    />
  );
};
