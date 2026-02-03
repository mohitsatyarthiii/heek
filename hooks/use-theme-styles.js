'use client';

import { useTheme } from '@/contexts/theme-context';

export function useThemeStyles() {
  const { theme } = useTheme();
  
  const getThemeClass = (lightClass, darkClass) => {
    return theme === 'light' ? lightClass : darkClass;
  };
  
  return {
    theme,
    getThemeClass,
    colors: {
      bg: theme === 'dark' ? 'bg-gray-900' : 'bg-white',
      text: theme === 'dark' ? 'text-white' : 'text-gray-900',
      border: theme === 'dark' ? 'border-gray-700' : 'border-gray-200',
      muted: theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
    }
  };
}