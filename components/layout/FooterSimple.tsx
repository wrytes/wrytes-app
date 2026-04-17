import { COMPANY } from '@/lib/constants';
import packageInfo from '../../package.json';

export default function FooterSimple() {
  return (
    <footer className="py-4">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
        <span className="text-text-muted text-sm">
          © {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
        </span>
        <span className="text-text-muted text-xs">Application Version {packageInfo.version}</span>
      </div>
    </footer>
  );
}
