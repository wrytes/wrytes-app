import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';

interface SectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  variant?: 'default' | 'card' | 'filled';
  spacing?: 'sm' | 'md' | 'lg';
  className?: string;
  actions?: ReactNode;
}

const SPACING = { sm: 'space-y-4', md: 'space-y-6', lg: 'space-y-8' };

export function Section({ title, description, children, variant = 'default', spacing = 'md', className, actions }: SectionProps) {
  return (
    <section className={cn(SPACING[spacing], className)}>
      {(title || description || actions) && (
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {title && <h2 className="text-xl font-bold text-white mb-1">{title}</h2>}
            {description && <p className="text-text-secondary">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
        </div>
      )}

      {variant === 'card' ? (
        <Card>{children}</Card>
      ) : variant === 'filled' ? (
        <div className="bg-dark-surface/30 rounded-xl p-6">{children}</div>
      ) : (
        children
      )}
    </section>
  );
}

export default Section;
