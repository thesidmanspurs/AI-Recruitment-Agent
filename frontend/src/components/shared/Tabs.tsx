import type { ReactNode } from 'react';

export interface TabSpec<TKey extends string = string> {
  key: TKey;
  label: string;
  icon?: ReactNode;
  badge?: ReactNode;
}

interface TabsProps<TKey extends string> {
  tabs: TabSpec<TKey>[];
  active: TKey;
  onChange: (next: TKey) => void;
  /** "dark" matches the admin console palette; "light" matches the user dashboard. */
  variant?: 'dark' | 'light';
  /** "horizontal" renders an underlined tab strip; "vertical" renders a sidebar list. */
  orientation?: 'horizontal' | 'vertical';
}

export function Tabs<TKey extends string>({
  tabs,
  active,
  onChange,
  variant = 'dark',
  orientation = 'horizontal',
}: TabsProps<TKey>) {
  const isDark = variant === 'dark';
  const isVertical = orientation === 'vertical';

  return (
    <div
      role="tablist"
      aria-orientation={isVertical ? 'vertical' : 'horizontal'}
      className={
        isVertical
          ? 'flex flex-col gap-1'
          : `flex items-center gap-1 ${isDark ? 'border-b border-white/5' : 'border-b border-gray-200'}`
      }
    >
      {tabs.map(t => {
        const isActive = t.key === active;

        const verticalCls = isActive
          ? isDark
            ? 'bg-indigo-600/20 border-indigo-500/40 text-white'
            : 'bg-indigo-50 border-indigo-200 text-indigo-700'
          : isDark
            ? 'border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200'
            : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900';

        const horizontalCls = isActive
          ? isDark
            ? 'text-white border-indigo-400'
            : 'text-indigo-700 border-indigo-500'
          : isDark
            ? 'text-gray-500 border-transparent hover:text-gray-300'
            : 'text-gray-500 border-transparent hover:text-gray-700';

        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t.key)}
            className={
              isVertical
                ? `flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold rounded-md border transition-colors text-left ${verticalCls}`
                : `flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-md transition-colors -mb-px border-b-2 ${horizontalCls}`
            }
          >
            {t.icon}
            <span className="flex-1">{t.label}</span>
            {t.badge !== undefined && t.badge !== null && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isActive
                    ? isDark
                      ? 'bg-indigo-500/30 text-indigo-200'
                      : 'bg-indigo-100 text-indigo-700'
                    : isDark
                      ? 'bg-white/5 text-gray-400'
                      : 'bg-gray-200 text-gray-600'
                }`}
              >
                {t.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
