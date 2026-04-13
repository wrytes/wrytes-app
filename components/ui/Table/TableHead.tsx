import { faArrowDownWideShort, faArrowUpShortWide, faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useEffect, useRef, useState } from 'react';

interface Props {
  headers: string[];
  subHeaders?: string[];
  actionCol?: boolean;
  colSpan?: number;
  tab?: string;
  reverse?: boolean;
  tabOnChange?: (tab: string) => void;
}

export default function TableHead({
  headers,
  subHeaders,
  actionCol,
  colSpan,
  tab = '',
  reverse = false,
  tabOnChange,
}: Props) {
  const handleOnClick = (active: string) => {
    tabOnChange?.(active);
  };

  return (
    <div className="items-center justify-between rounded-t-lg bg-table-header-primary py-4 px-8 md:flex xl:px-12">
      {/* Desktop */}
      <div
        className="max-md:hidden pl-8 flex-grow md:grid"
        style={{ gridTemplateColumns: `repeat(${colSpan || headers.length}, minmax(0, 1fr))` }}
      >
        {headers.map((header, i) => (
          <div
            key={`table-header-${i}`}
            className={`${i > 0 ? 'text-right' : ''}`}
            onClick={() => handleOnClick(header)}
          >
            <span
              className={`font-bold ${tab ? 'cursor-pointer' : ''} ${
                tab === header ? 'text-text-active' : 'text-text-header'
              }`}
            >
              {header}
            </span>
            {tab === header && (
              <FontAwesomeIcon
                icon={reverse ? faArrowUpShortWide : faArrowDownWideShort}
                className="ml-2 cursor-pointer text-text-active"
              />
            )}
          </div>
        ))}
        {subHeaders?.map((header, i) => (
          <div key={`table-subheader-${i}`} className={`${i > 0 ? 'text-right' : ''}`}>
            <span className="text-text-subheader">{header}</span>
          </div>
        ))}
      </div>

      {actionCol && (
        <div className="max-md:hidden">
          <div className={`text-text-header text-right w-40 flex-shrink-0 ${subHeaders ? 'items-center' : ''}`} />
          {subHeaders && <span> </span>}
        </div>
      )}

      {/* Mobile */}
      <TableHeadMobile headers={headers} tab={tab} reverse={reverse} tabOnChange={handleOnClick} />
    </div>
  );
}

interface TableHeadMobileProps {
  headers: string[];
  tab: string;
  reverse: boolean;
  tabOnChange: (tab: string) => void;
}

function TableHeadMobile({ headers, tab, reverse, tabOnChange }: TableHeadMobileProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="md:hidden flex items-center gap-3">
      <span className="flex-1 font-semibold text-text-secondary">Sort By</span>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-2 bg-dark-card text-text-primary text-sm rounded-md px-2 py-1.5 border border-table-header-secondary outline-none cursor-pointer"
        >
          <span>{tab || headers[0]}</span>
          <FontAwesomeIcon icon={reverse ? faArrowUpShortWide : faArrowDownWideShort} className="w-3 h-3 text-text-secondary" />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 z-50 min-w-full rounded-lg bg-dark-card shadow-card border border-table-header-secondary py-1">
            {headers.map((h) => (
              <button
                key={h}
                onClick={() => { tabOnChange(h); setOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-table-row-hover"
              >
                <span className={`flex-1 ${tab === h ? 'text-text-active font-semibold' : 'text-text-primary'}`}>{h}</span>
                {tab === h && <FontAwesomeIcon icon={faCheck} className="w-3 h-3 text-button-default" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
