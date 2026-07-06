import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBuilding,
  faShieldHalved,
  faUsers,
  faChevronRight,
  faStar,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@/hooks/useAuth';
import type { Namespace } from '@/lib/auth/types';

interface NamespaceSelectorProps {
  namespaces: Namespace[];
}

export function NamespaceSelector({ namespaces }: NamespaceSelectorProps) {
  const { setActiveNamespace } = useAuth();

  return (
    <div className="w-full">
      <div className="space-y-2">
        {namespaces.map((ns, i) => (
          <motion.button
            key={ns.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setActiveNamespace(ns)}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-input-border bg-surface hover:bg-card hover:border-brand transition-all text-left group"
          >
            {/* Icon */}
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center">
              <FontAwesomeIcon icon={faBuilding} className="text-brand text-sm" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-text-primary truncate">{ns.name}</p>
                {ns.role === 'OWNER' && (
                  <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-medium text-brand bg-brand/10 border border-brand/20 rounded px-1.5 py-0.5">
                    <FontAwesomeIcon icon={faStar} className="text-[9px]" />
                    Owner
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                {ns.safeWallets.length > 0 && (
                  <span className="text-[11px] text-text-muted flex items-center gap-1">
                    <FontAwesomeIcon icon={faShieldHalved} className="text-[10px]" />
                    {ns.safeWallets.length} Safe
                  </span>
                )}
                {ns.members.length > 0 && (
                  <span className="text-[11px] text-text-muted flex items-center gap-1">
                    <FontAwesomeIcon icon={faUsers} className="text-[10px]" />
                    {ns.members.length} member{ns.members.length !== 1 ? 's' : ''}
                  </span>
                )}
                {!ns.telegramGroupId && (
                  <span className="text-[11px] text-text-muted">Personal</span>
                )}
              </div>
            </div>

            {/* Arrow */}
            <FontAwesomeIcon
              icon={faChevronRight}
              className="text-text-muted text-xs flex-shrink-0 group-hover:text-brand transition-colors"
            />
          </motion.button>
        ))}
      </div>
    </div>
  );
}
