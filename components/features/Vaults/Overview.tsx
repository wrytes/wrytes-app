import React, { useState, useEffect } from 'react';
import { 
  faPiggyBank, 
  faChartLine, 
  faDollarSign, 
  faShieldAlt
} from '@fortawesome/free-solid-svg-icons';
import { StatGrid } from '@/components/ui/Stats';
import { VAULTS } from '@/lib/vaults/config';
import { SavingsOverviewProps } from './types';
import { formatCompactNumber } from '@/lib/utils/format-number';

/**
 * Overview - Stats overview for vaults page
 * Extracts and reuses the stats calculation logic
 * Uses new StatCard components for consistent display
 */
export const Overview: React.FC<SavingsOverviewProps> = ({
  stats,
  loading = false,
  className
}) => {
  const [totalApy, setTotalApy] = useState(0);
  const [totalTvl, setTotalTvl] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Calculate stats from vaults
  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoadingStats(true);
        const apyValues = await Promise.all(VAULTS.map(vault => vault.apy()));
        const tvlValues = await Promise.all(VAULTS.map(vault => vault.tvl()));
        
        const avgApy = apyValues.reduce((sum, apy) => sum + apy, 0) / apyValues.length;
        const totalTvlValue = tvlValues.reduce((sum, tvl) => sum + tvl, 0);
        
        setTotalApy(avgApy);
        setTotalTvl(totalTvlValue);
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadStats();
  }, []);

  // Default overview stats
  const defaultStats = [
    {
      icon: faPiggyBank,
      label: 'Total Value Locked',
      value: `$${formatCompactNumber(totalTvl, 0)}`,
      color: 'orange' as const,
      loading: isLoadingStats
    },
    {
      icon: faChartLine,
      label: 'Average APY',
      value: `${totalApy.toFixed(2)}%`,
      color: 'green' as const,
      loading: isLoadingStats
    },
    {
      icon: faDollarSign,
      label: 'Your Deposits',
      value: '$2,450', // This would come from user data
      color: 'blue' as const
    },
    {
      icon: faShieldAlt,
      label: 'Active Vaults',
      value: VAULTS.length,
      color: 'purple' as const
    }
  ];

  // Use provided stats or default stats
  const statsData = stats || defaultStats;

  return (
    <StatGrid
      stats={statsData}
      loading={loading || isLoadingStats}
      columns={{
        base: 1,
        md: 4
      }}
      className={className}
    />
  );
};

export default Overview;