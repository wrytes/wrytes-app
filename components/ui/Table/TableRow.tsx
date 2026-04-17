import React from 'react';

interface Props {
  children: React.ReactElement | React.ReactElement[];
  actionCol?: React.ReactElement;
  colSpan?: number;
  className?: string;
  classNameMobile?: string;
  headers?: string[];
  subHeaders?: string[];
  tab?: string;
  rawHeader?: boolean;
  paddingY?: string;
}

export default function TableRow({
  colSpan,
  children,
  actionCol,
  headers = [],
  subHeaders = [],
  tab = '',
  className,
  classNameMobile = '',
  rawHeader = false,
  paddingY,
}: Props) {
  const childArray = React.Children.toArray(children) as React.ReactElement[];

  return (
    <div
      className={`${className ?? ''} ${
        paddingY ?? 'py-4'
      } bg-card md:hover:bg-surface cursor-default p-4 xl:px-6 border-t border-table-alt last:rounded-b-lg duration-300`}
    >
      <div className="flex flex-col justify-between gap-y-5 md:flex-row">
        {/* Desktop */}
        <div
          className="max-md:hidden text-right grid flex-grow items-center"
          style={{ gridTemplateColumns: `repeat(${colSpan || childArray.length}, minmax(0, 1fr))` }}
        >
          {children}
        </div>

        {/* Mobile */}
        <TableRowMobile
          headers={headers}
          subHeaders={subHeaders}
          tab={tab}
          className={classNameMobile}
          rawHeader={rawHeader}
        >
          {childArray}
        </TableRowMobile>

        {/* Action column */}
        {actionCol && (
          <div className="flex-shrink-0 md:w-[8rem] md:ml-[2rem] max-md:w-full my-2">
            {actionCol}
          </div>
        )}
      </div>
    </div>
  );
}

interface TableRowMobileProps {
  children: React.ReactElement[];
  headers: string[];
  subHeaders: string[];
  tab: string;
  className: string;
  rawHeader: boolean;
}

function TableRowMobile({
  children,
  rawHeader,
  headers,
  subHeaders,
  tab,
  className,
}: TableRowMobileProps) {
  if (headers.length === 0) {
    return (
      <div
        className={`${className} md:hidden justify-items-center text-center gap-6 grid flex-grow grid-cols-1`}
      >
        {children}
      </div>
    );
  }

  return (
    <div className={`${className} md:hidden gap-6 grid-cols-1 flex-1`}>
      {children.map((c, idx) => (
        <div className="py-0.5 flex items-center" key={c.key ?? `row-mobile-${tab}-${idx}`}>
          <div className="flex-1 text-left">
            {idx === 0 && !rawHeader ? (
              <div
                className={
                  headers[idx] === tab ? 'text-text-primary font-semibold' : 'text-text-secondary'
                }
              >
                {c}
              </div>
            ) : subHeaders.length === 0 ? (
              <div
                className={`text-md ${headers[idx] === tab ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}
              >
                {headers[idx]}
              </div>
            ) : (
              <div>
                <div
                  className={`text-md ${
                    headers[idx] === tab ? 'text-text-primary font-semibold' : 'text-text-secondary'
                  }`}
                >
                  {headers[idx]}
                </div>
                <div className="text-sm text-text-secondary">{subHeaders[idx]}</div>
              </div>
            )}
          </div>
          <div
            className={`text-right ${headers[idx] === tab ? 'text-text-primary font-semibold' : 'text-text-secondary'}`}
          >
            {idx === 0 && !rawHeader ? '' : c}
          </div>
        </div>
      ))}
    </div>
  );
}
