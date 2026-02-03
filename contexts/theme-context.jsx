'use client';

import { createContext, useContext, useState, useEffect } from 'react';

// Theme types
const THEMES = {
  DARK: 'dark',
  LIGHT: 'light'
};

// Theme colors for both modes
const themeColors = {
  [THEMES.LIGHT]: {
    background: '#ffffff',
    foreground: '#020817',
    card: '#ffffff',
    cardForeground: '#020817',
    primary: '#0f172a',
    primaryForeground: '#f8fafc',
    secondary: '#f1f5f9',
    secondaryForeground: '#0f172a',
    muted: '#f8fafc',
    mutedForeground: '#64748b',
    accent: '#f1f5f9',
    accentForeground: '#0f172a',
    destructive: '#ef4444',
    destructiveForeground: '#f8fafc',
    border: '#e2e8f0',
    input: '#e2e8f0',
    ring: '#020817',
    radius: '0.5rem',
  },
  [THEMES.DARK]: {
    background: '#0f172a',
    foreground: '#f8fafc',
    card: '#1e293b',
    cardForeground: '#f8fafc',
    primary: '#f8fafc',
    primaryForeground: '#0f172a',
    secondary: '#334155',
    secondaryForeground: '#f8fafc',
    muted: '#1e293b',
    mutedForeground: '#94a3b8',
    accent: '#334155',
    accentForeground: '#f8fafc',
    destructive: '#7f1d1d',
    destructiveForeground: '#f8fafc',
    border: '#334155',
    input: '#334155',
    ring: '#cbd5e1',
    radius: '0.5rem',
  }
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(THEMES.LIGHT); // Start with light theme
  const [mounted, setMounted] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    setMounted(true);
    
    // Check localStorage for saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === THEMES.DARK || savedTheme === THEMES.LIGHT) {
      setTheme(savedTheme);
    } else {
      // Default to light theme
      setTheme(THEMES.LIGHT);
      localStorage.setItem('theme', THEMES.LIGHT);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;

    // Update HTML class
    const html = document.documentElement;
    html.classList.remove(THEMES.DARK, THEMES.LIGHT);
    html.classList.add(theme);

    // Update CSS variables
    const colors = themeColors[theme];
    Object.entries(colors).forEach(([key, value]) => {
      html.style.setProperty(`--${key}`, value);
    });

    // Update localStorage
    localStorage.setItem('theme', theme);

    // Update meta theme-color for mobile
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', colors.background);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(current => current === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK);
  };

  const setThemeMode = (mode) => {
    if (mode === THEMES.DARK || mode === THEMES.LIGHT) {
      setTheme(mode);
    }
  };

  const value = {
    theme,
    isDark: theme === THEMES.DARK,
    isLight: theme === THEMES.LIGHT,
    toggleTheme,
    setTheme: setThemeMode,
    colors: themeColors[theme]
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}