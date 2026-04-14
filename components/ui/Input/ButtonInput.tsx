import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonDef {
  label: React.ReactNode;
  onClick?: () => void;
  href?: string;
  target?: string;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

interface ButtonInputProps extends ButtonDef {
  second?: ButtonDef;
  /** Override layout when two buttons are present. Default: 'row' */
  layout?: 'row' | 'col';
}

const BASE =
  'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

const VARIANTS: Record<Variant, string> = {
  primary:   'bg-accent-orange text-white hover:bg-opacity-90 shadow-md hover:shadow-lg',
  secondary: 'bg-dark-card text-text-primary hover:bg-opacity-80 border border-text-muted',
  outline:   'border border-accent-orange text-accent-orange hover:bg-accent-orange hover:text-white',
  ghost:     'text-text-secondary hover:text-text-primary hover:bg-dark-card',
};

const SIZES: Record<Size, string> = {
  sm: 'px-2 py-1 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-lg',
};

function SingleButton({
  label,
  onClick,
  href,
  target,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  className,
}: ButtonDef) {
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], className);

  const content = (
    <>
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon && <span>{icon}</span>
      )}
      {label}
    </>
  );

  if (href) {
    return (
      <Link href={href} target={target} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {content}
    </button>
  );
}

export default function ButtonInput({
  second,
  layout = 'row',
  ...primary
}: ButtonInputProps) {
  if (!second) {
    return <SingleButton {...primary} />;
  }

  return (
    <div className={cn('flex gap-3', layout === 'col' ? 'flex-col' : 'flex-row')}>
      <SingleButton {...primary} />
      <SingleButton {...second} />
    </div>
  );
}
