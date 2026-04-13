interface BadgeProps {
  text: string;
  variant?: 'risk' | 'custom';
  riskLevel?: 'low' | 'medium' | 'high';
  customColor?: string;
  customBgColor?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const RISK_COLORS: Record<string, string> = {
  low:    'text-green-400 bg-green-400/20',
  medium: 'text-yellow-400 bg-yellow-400/20',
  high:   'text-red-400 bg-red-400/20',
};

const SIZES: Record<string, string> = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

export function Badge({
  text,
  variant = 'risk',
  riskLevel,
  customColor,
  customBgColor,
  size = 'sm',
  className = '',
}: BadgeProps) {
  const color =
    variant === 'custom' && customColor && customBgColor
      ? `${customColor} ${customBgColor}`
      : variant === 'risk' && riskLevel
        ? (RISK_COLORS[riskLevel] ?? 'text-gray-300 bg-gray-700/60')
        : 'text-gray-300 bg-gray-700/60';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-medium border border-transparent ${SIZES[size] ?? SIZES.sm} ${color} ${className}`}
    >
      {text}
    </span>
  );
}
