import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons';

interface TokenLogoProps {
  logoURI?: string;
  currency?: string; // used as alt text
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

  if (!logoURI || failed) {
    return (
      <FontAwesomeIcon
        icon={faCircleQuestion}
        className={`w-${size} h-${size} text-text-secondary ${className}`}
      />
    );
  }

  return (
    <img
      src={logoURI}
      className={`w-${size} h-${size} rounded-full ${className}`}
      alt={currency ?? 'token'}
      onError={() => setFailed(true)}
    />
  );
};
