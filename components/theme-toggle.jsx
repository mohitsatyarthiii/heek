'use client';

import { useTheme } from '@/contexts/theme-context';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, toggleTheme, isDark, isLight } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary hover:bg-accent transition-colors border border-border"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Current: ${theme === 'dark' ? 'Dark' : 'Light'} mode`}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-yellow-500" />
      ) : (
        <Moon className="h-5 w-5 text-gray-700" />
      )}
    </button>
  );
}