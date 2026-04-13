import { faArrowDownWideShort, faArrowUpShortWide } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

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
      <div className={`max-md:hidden pl-8 flex-grow grid-cols-2 md:grid md:grid-cols-${colSpan || headers.length}`}>
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
  return (
    <div className="md:hidden flex items-center gap-3">
      <span className="flex-1 font-semibold text-text-secondary">Sort By</span>
      <div className="flex items-center gap-2">
        {tab && (
          <FontAwesomeIcon
            icon={reverse ? faArrowUpShortWide : faArrowDownWideShort}
            className="text-text-active w-4 h-4"
          />
        )}
        <select
          value={tab}
          onChange={(e) => tabOnChange(e.target.value)}
          className="bg-dark-card text-text-primary text-sm rounded-md px-2 py-1.5 border border-table-header-secondary outline-none cursor-pointer"
        >
          {headers.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
