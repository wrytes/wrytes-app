import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';

interface ChainLogoProps {
  chain?: string;
  size?: number;
  className?: string;
}

export const ChainLogo: React.FC<ChainLogoProps> = ({ chain, size = 6, className = '' }) => {
  const [failed, setFailed] = useState(false);

  const src = chain ? `/chain/${chain.toLowerCase()}.svg` : undefined;

  if (!src || failed) {
    return (
      <FontAwesomeIcon
        icon={faCircleQuestion}
        className={`w-${size} h-${size} text-text-secondary ${className}`}
      />
    );
  }

  const px = size * 4;

  return (
    <Image
      src={src}
      width={px}
      height={px}
      className={`w-${size} h-${size} rounded-full ${className}`}
      alt={chain ?? 'chain'}
      onError={() => setFailed(true)}
    />
  );
};
