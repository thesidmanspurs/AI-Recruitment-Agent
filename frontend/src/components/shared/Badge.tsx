import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple';
  size?: 'sm' | 'md';
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  blue: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
  green: 'bg-green-900/40 text-green-300 border-green-700/50',
  yellow: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/50',
  red: 'bg-red-900/40 text-red-300 border-red-700/50',
  gray: 'bg-gray-800 text-gray-400 border-gray-700',
  purple: 'bg-purple-900/40 text-purple-300 border-purple-700/50',
};

const sizeClasses: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export function Badge({ children, variant = 'gray', size = 'md' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full border font-medium',
        variantClasses[variant],
        sizeClasses[size],
      ].join(' ')}
    >
      {children}
    </span>
  );
}
