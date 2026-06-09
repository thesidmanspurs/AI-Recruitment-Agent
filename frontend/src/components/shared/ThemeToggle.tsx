import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../store/ThemeContext';

/**
 * Light/dark toggle for the workspace. Compact icon button that matches the
 * header's button styling in both themes.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <button
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle theme"
      className={`flex items-center justify-center w-8 h-8 rounded-md border transition-colors
        bg-white border-gray-300 text-gray-600 hover:bg-gray-50
        dark:bg-white/5 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10 ${className}`}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
