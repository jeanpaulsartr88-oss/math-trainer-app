import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  isDark: false,
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // 1. Check saved local preference
    const saved = localStorage.getItem('math_lms_theme');
    if (saved === 'dark' || saved === 'light') return saved;

    // 2. Check Telegram WebApp theme
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.colorScheme) {
      return window.Telegram.WebApp.colorScheme === 'dark' ? 'dark' : 'light';
    }

    // 3. Check system preference
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    localStorage.setItem('math_lms_theme', theme);

    // Sync header color with Telegram
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.setHeaderColor) {
      try {
        window.Telegram.WebApp.setHeaderColor(theme === 'dark' ? '#0F172A' : '#FFFFFF');
      } catch (e) {}
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
