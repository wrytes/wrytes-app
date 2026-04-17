import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cn } from '@/lib/utils';
import { NavigationItem } from '@/lib/navigation/dashboard';

interface SidebarDashboardProps {
  items: NavigationItem[];
  isActive: (path: string) => boolean;
  onItemClick: () => void;
  variant: 'desktop' | 'mobile';
}

export function SidebarDashboard({ items, isActive, onItemClick, variant }: SidebarDashboardProps) {
  const isMobile = variant === 'mobile';

  const linkClass = (active: boolean) =>
    cn(
      'flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200',
      active
        ? 'text-brand bg-brand/20 shadow-sm'
        : 'text-text-secondary hover:text-brand hover:bg-brand/20 hover:shadow-sm',
    );

  if (isMobile) {
    return (
      <nav className="space-y-4">
        <div className="space-y-4">
          {items.map((item) => (
            <Link key={item.path} href={item.path} className={linkClass(isActive(item.path))} onClick={onItemClick}>
              <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav className="p-4">
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.path}>
            <Link href={item.path} className={linkClass(isActive(item.path))} onClick={onItemClick}>
              <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
} 