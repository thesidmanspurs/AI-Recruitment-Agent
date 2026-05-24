import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onChange: (nextPage: number) => void;
  variant?: 'dark' | 'light';
}

export function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  onChange,
  variant = 'dark',
}: PaginationProps) {
  const isDark = variant === 'dark';
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const baseBtn = isDark
    ? 'bg-[#0d1117] border border-white/10 text-gray-300 hover:bg-[#1e2338] hover:text-white'
    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50';

  return (
    <div
      className={`flex items-center justify-between px-4 py-3 text-xs ${
        isDark ? 'border-t border-white/5 bg-[#0d1117]/30' : 'border-t border-gray-100 bg-gray-50/50'
      }`}
    >
      <span className={isDark ? 'text-gray-500' : 'text-gray-500'}>
        {total === 0 ? (
          'No results'
        ) : (
          <>
            <span className={`font-semibold tabular-nums ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {from}–{to}
            </span>{' '}
            of{' '}
            <span className={`font-semibold tabular-nums ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {total}
            </span>
          </>
        )}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md ${baseBtn} disabled:opacity-40 disabled:cursor-not-allowed transition-colors`}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Prev
        </button>
        <span className={`text-[11px] tabular-nums ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Page <span className={`font-bold ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{page}</span>{' '}
          / {totalPages}
        </span>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md ${baseBtn} disabled:opacity-40 disabled:cursor-not-allowed transition-colors`}
        >
          Next
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
