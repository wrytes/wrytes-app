import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faArrowDown } from '@fortawesome/free-solid-svg-icons';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';
import { StatCardProps } from './types';

/**
 * StatCard - Reusable statistics display component
 * Replaces the duplicated stat card patterns across dashboard and savings pages
 */
export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  trend,
  color = 'orange',
  loading = false,
  className,
  onClick
}) => {
  // Color variants for icons and backgrounds
  const colorVariants = {
    orange: 'text-accent-orange bg-accent-orange/20',
    green: 'text-green-400 bg-green-400/20',
    blue: 'text-blue-400 bg-blue-400/20',
    purple: 'text-purple-400 bg-purple-400/20',
    yellow: 'text-yellow-400 bg-yellow-400/20'
  };

  // Trend color variants
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400'
  };

  // Format value for display
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      // Format large numbers with K/M/B suffixes
      if (val >= 1000000000) {
        return `${(val / 1000000000).toFixed(1)}B`;
      } else if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toString();
    }
    return val;
  };

  if (loading) {
    return <StatCardSkeleton className={className} />;
  }

  const cardContent = (
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-text-secondary text-sm font-medium mb-1">
          {label}
        </p>
        <div>
          <p className="text-3xl font-bold text-white mb-1">
            {formatValue(value)}
          </p>
          {trend && (
            <div className={cn(
              'flex items-center gap-1 text-sm font-medium',
              trendColors[trend.direction]
            )}>
              <FontAwesomeIcon 
                icon={trend.direction === 'up' ? faArrowUp : faArrowDown}
                className="w-3 h-3"
              />
              <span>{Math.abs(trend.value)}%</span>
              {trend.label && (
                <span className="text-text-secondary ml-1">
                  {trend.label}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      <div className={cn(
        'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
        colorVariants[color]
      )}>
        <FontAwesomeIcon icon={icon} className="w-6 h-6" />
      </div>
    </div>
  );

  if (onClick) {
    return (
      <div
        className={cn('cursor-pointer', className)}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <Card hover={false}>
          {cardContent}
        </Card>
      </div>
    );
  }

  return (
    <Card hover={false} className={className}>
      {cardContent}
    </Card>
  );
};

/**
 * StatCardSkeleton - Loading skeleton for StatCard
 */
export const StatCardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <Card className={cn('animate-pulse', className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="w-20 h-4 bg-dark-surface/30 rounded mb-2"></div>
          <div className="w-16 h-8 bg-dark-surface/30 rounded"></div>
        </div>
        <div className="w-12 h-12 bg-dark-surface/30 rounded-lg flex-shrink-0"></div>
      </div>
    </Card>
  );
};

export default StatCard;