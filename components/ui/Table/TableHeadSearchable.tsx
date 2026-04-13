import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowDownWideShort,
  faArrowUpShortWide,
  faMagnifyingGlass,
  faSlidersH,
} from '@fortawesome/free-solid-svg-icons';

export interface FilterOption {
  label: string;
  value: string;
}

interface Props {
  // Search
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;

  // In my wallet toggle
  hideMyWallet?: boolean;
  inMyWallet: boolean;
  onInMyWalletChange: (value: boolean) => void;

  // Category filter
  filterOptions: FilterOption[];
  activeFilters: string[];
  onFiltersChange: (filters: string[]) => void;

  // Custom categories filter
  customCategories?: string[];
  customCategoriesTitle?: string;
  activeCustomCategories?: string[];
  onCustomCategoriesChange?: (values: string[]) => void;

  // Table column headers
  headers: string[];
  subHeaders?: string[];
  actionCol?: boolean;
  colSpan?: number;
  tab?: string;
  reverse?: boolean;
  tabOnChange?: (tab: string) => void;
}

export default function TableHeadSearchable({
  searchPlaceholder = 'Search',
  searchValue,
  onSearchChange,
  hideMyWallet,
  inMyWallet,
  onInMyWalletChange,
  filterOptions,
  activeFilters,
  onFiltersChange,
  customCategories,
  customCategoriesTitle = 'State',
  activeCustomCategories = [],
  onCustomCategoriesChange,
  headers,
  subHeaders,
  actionCol,
  colSpan,
  tab = '',
  reverse = false,
  tabOnChange,
}: Props) {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTabClick = (header: string) => tabOnChange?.(header);

  const toggleFilter = (value: string) => {
    if (activeFilters.includes(value)) {
      onFiltersChange(activeFilters.filter((f) => f !== value));
    } else {
      onFiltersChange([...activeFilters, value]);
    }
  };

  const toggleCustomCategory = (value: string) => {
    if (!onCustomCategoriesChange) return;
    if (activeCustomCategories.includes(value)) {
      onCustomCategoriesChange(activeCustomCategories.filter((f) => f !== value));
    } else {
      onCustomCategoriesChange([...activeCustomCategories, value]);
    }
  };

  const totalActiveFilters = activeFilters.length + activeCustomCategories.length;

  return (
    <div className="rounded-t-lg bg-table-header-primary">
      {/* Search / toggle / filter bar */}
      <div className="grid grid-cols-1 md:flex md:items-center md:justify-between px-7 xl:px-11 py-4 border-b border-table-header-secondary gap-3">
        {/* Search */}
        <div className="flex flex-1 items-center gap-2 text-text-secondary">
          <FontAwesomeIcon icon={faMagnifyingGlass} className="w-4 h-4 text-text-secondary" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="bg-transparent outline-none text-sm text-text-primary placeholder:text-text-secondary w-full"
          />
        </div>

        {/* Right controls */}
        <div className="flex items-center justify-end gap-5">
          {/* In my wallet toggle */}
          {!hideMyWallet && (
            <div className="flex items-center gap-2">
              <button
                role="switch"
                aria-checked={inMyWallet}
                onClick={() => onInMyWalletChange(!inMyWallet)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  inMyWallet ? 'bg-button-default' : 'bg-button-disabled'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    inMyWallet ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-text-secondary whitespace-nowrap">In my wallet</span>
            </div>
          )}

          {/* Filter button + dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen((prev) => !prev)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors border ${
                filterOpen || totalActiveFilters > 0
                  ? 'border-button-default text-text-active bg-button-default/10'
                  : 'border-table-header-secondary text-text-secondary hover:bg-button-disabled/30'
              }`}
            >
              <FontAwesomeIcon icon={faSlidersH} className="w-3.5 h-3.5" />
              <span>Filter</span>
              {totalActiveFilters > 0 && (
                <span className="ml-1 bg-button-default text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {totalActiveFilters}
                </span>
              )}
            </button>

            {filterOpen && (
              <div className="absolute right-0 top-full mt-2 z-50 w-52 rounded-lg bg-dark-card shadow-card border border-table-header-secondary py-3">
                {filterOptions.length > 0 && (
                  <>
                    <div className="px-4 pb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-text-subheader">
                        Asset Categories
                      </span>
                    </div>
                    {filterOptions.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-table-row-hover"
                      >
                        <input
                          type="checkbox"
                          checked={activeFilters.includes(opt.value)}
                          onChange={() => toggleFilter(opt.value)}
                          className="w-4 h-4 rounded accent-button-default"
                        />
                        <span className="text-sm text-text-primary">{opt.label}</span>
                      </label>
                    ))}
                  </>
                )}
                {customCategories && customCategories.length > 0 && (
                  <>
                    {filterOptions.length > 0 && (
                      <div className="my-2 border-t border-table-header-secondary" />
                    )}
                    <div className="px-4 pb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-text-subheader">
                        {customCategoriesTitle}
                      </span>
                    </div>
                    {customCategories.map((category) => (
                      <label
                        key={category}
                        className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-table-row-hover"
                      >
                        <input
                          type="checkbox"
                          checked={activeCustomCategories.includes(category)}
                          onChange={() => toggleCustomCategory(category)}
                          className="w-4 h-4 rounded accent-button-default"
                        />
                        <span className="text-sm text-text-primary">{category}</span>
                      </label>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Column headers — desktop */}
      <div className="items-center justify-between py-4 px-8 md:flex xl:px-12">
        <div className={`max-md:hidden pl-8 flex-grow grid-cols-2 md:grid md:grid-cols-${colSpan || headers.length}`}>
          {headers.map((header, i) => (
            <div
              key={`th-${i}`}
              className={`${i > 0 ? 'text-right' : ''}`}
              onClick={() => handleTabClick(header)}
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
            <div key={`th-sub-${i}`} className={`${i > 0 ? 'text-right' : ''}`}>
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

        {/* Column headers — mobile */}
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
              onChange={(e) => handleTabClick(e.target.value)}
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
      </div>
    </div>
  );
}
