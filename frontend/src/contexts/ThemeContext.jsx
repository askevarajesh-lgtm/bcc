import React, { createContext, useContext, useState, useEffect } from 'react';
import { ConfigProvider, theme as antTheme } from 'antd';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const isDark = theme === 'dark';

  const antdConfig = {
    algorithm: isDark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
    token: {
      fontFamily: `'Plus Jakarta Sans', sans-serif`,
      fontSize: 14,
      colorPrimary: '#3b82f6',
      colorSuccess: '#10b981',
      colorWarning: '#f59e0b',
      colorError: '#ef4444',
      colorText: isDark ? '#f8fafc' : '#071733',
      colorTextSecondary: isDark ? '#c7d2e4' : '#536484',
      colorBorder: isDark ? '#22324b' : '#e5ebf3',
      colorBgLayout: isDark ? '#0b1220' : '#f5f8fc',
      borderRadius: 12,
    },
    components: {
      Typography: {
        fontWeightStrong: 800,
      },
      Card: {
        colorBgContainer: isDark ? '#111c31' : '#ffffff',
        colorBorderSecondary: isDark ? '#22324b' : '#e5ebf3',
      },
      Menu: {
        colorItemBg: 'transparent',
        colorItemBgSelected: 'transparent',
        colorItemTextSelected: '#10b981',
      },
      Layout: {
        colorBgHeader: isDark ? '#0d1526' : '#ffffff',
        colorBgBody: isDark ? '#0b1220' : '#f5f8fc',
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      <ConfigProvider theme={antdConfig}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};
