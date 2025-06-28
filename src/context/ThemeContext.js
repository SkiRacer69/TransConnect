import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const theme = {
    colors: {
      primary: '#1976D2',
      secondary: '#424242',
      background: isDarkMode ? '#121212' : '#f5f5f5',
      surface: isDarkMode ? '#1e1e1e' : '#ffffff',
      surfaceVariant: isDarkMode ? '#2d2d2d' : '#f5f5f5',
      onSurface: isDarkMode ? '#ffffff' : '#000000',
      onBackground: isDarkMode ? '#ffffff' : '#000000',
      error: '#B00020',
      success: '#4CAF50',
      warning: '#FF9800',
    },
    isDarkMode,
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const value = {
    theme,
    isDarkMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 