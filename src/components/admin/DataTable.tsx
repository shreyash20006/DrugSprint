import React from 'react';
import { Search, Loader2 } from 'lucide-react';

interface HeaderColumn {
  key: string;
  label: string;
  className?: string;
}

interface FilterOption {
  value: string;
  label: string;
}

interface DataTableProps {
  headers: HeaderColumn[];
  data: any[];
  isLoading: boolean;
  emptyState: {
    icon: React.ReactNode;
    title: string;
    description: string;
  };
  
  // Searching
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;

  // Filtering
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: FilterOption[];

  // Secondary Filter (optional, e.g. directed_to)
  secondaryFilterValue?: string;
  onSecondaryFilterChange?: (value: string) => void;
  secondaryFilterOptions?: FilterOption[];

  // Row Renders
  renderRowDesktop: (item: any) => React.ReactNode;
  renderCardMobile: (item: any) => React.ReactNode;
}

export const DataTable: React.FC<DataTableProps> = ({
  headers,
  data,
  isLoading,
  emptyState,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filterValue,
  onFilterChange,
  filterOptions,
  secondaryFilterValue,
  onSecondaryFilterChange,
  secondaryFilterOptions,
  renderRowDesktop,
  renderCardMobile,
}) => {
  const showFiltersStrip = onSearchChange || onFilterChange || onSecondaryFilterChange;

  return (
    <div className="space-y-4">
      
      {/* 1. FILTER & SEARCH CONTROL STRIP */}
      {showFiltersStrip && (
        <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 p-4 rounded-xl flex flex-col md:flex-row items-center gap-4">
          
          {/* Search Input Box */}
          {onSearchChange && (
            <div className="relative w-full md:flex-grow">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/30">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-sm placeholder-white/30 outline-none focus:border-orange-burnt/50 transition-all"
              />
            </div>
          )}

          {/* Filters Row Container */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {/* Primary Dropdown Filter */}
            {onFilterChange && filterOptions && (
              <select
                value={filterValue}
                onChange={(e) => onFilterChange(e.target.value)}
                className="w-full sm:w-44 px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-xs font-semibold uppercase tracking-wider outline-none focus:border-orange-burnt/50 appearance-none cursor-pointer transition-all"
              >
                {filterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#0A1428] text-white normal-case">
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {/* Secondary Dropdown Filter */}
            {onSecondaryFilterChange && secondaryFilterOptions && (
              <select
                value={secondaryFilterValue}
                onChange={(e) => onSecondaryFilterChange(e.target.value)}
                className="w-full sm:w-52 px-3 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-xs font-semibold uppercase tracking-wider outline-none focus:border-orange-burnt/50 appearance-none cursor-pointer transition-all"
              >
                {secondaryFilterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#0A1428] text-white normal-case">
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
          </div>

        </div>
      )}

      {/* 2. MAIN DATA RENDER Container */}
      <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center text-white/40">
            <Loader2 className="w-10 h-10 text-orange-burnt animate-spin mb-4" />
            <p className="font-display text-sm tracking-wider uppercase">Loading data...</p>
          </div>
        ) : data.length > 0 ? (
          <>
            {/* DESKTOP TABLE VIEW (Visible on md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/20 border-b border-white/10">
                    {headers.map((head) => (
                      <th
                        key={head.key}
                        className={`px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/40 ${head.className || ''}`}
                      >
                        {head.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {data.map((item) => renderRowDesktop(item))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS VIEW (Visible on <md) */}
            <div className="md:hidden divide-y divide-white/[0.04]">
              {data.map((item) => renderCardMobile(item))}
            </div>
          </>
        ) : (
          /* EMPTY STATE VIEW */
          <div className="text-center py-20 px-4">
            <div className="text-white/10 mx-auto mb-4 w-12 h-12 flex items-center justify-center">
              {emptyState.icon}
            </div>
            <h3 className="font-display font-extrabold text-base text-white/60 uppercase tracking-wider">
              {emptyState.title}
            </h3>
            <p className="text-xs text-white/30 max-w-xs mx-auto mt-1.5 leading-relaxed font-sans">
              {emptyState.description}
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default DataTable;
