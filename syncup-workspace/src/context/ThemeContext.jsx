import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const DEFAULT_SETTINGS = {
  desktopNotifications: true,
  emailNotifications: true,
  sound: true,
  messagePreviews: true,
  mentions: true,
  directMessages: true,
  language: 'English (US)',
  timezone: 'Pacific Time (PT)',
};

const DEFAULT_USER = {
  id: 6,
  firstName: 'John',
  lastName: 'Doe',
  displayName: 'John Doe',
  email: 'john@company.com',
  bio: '',
  phone: '',
  avatar: 'JD',
  color: 'from-pink-500 to-rose-500',
  status: 'online',
};

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('syncup_darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('syncup_currentUser');
    if (saved) {
      try { return { ...DEFAULT_USER, ...JSON.parse(saved) }; } catch { return DEFAULT_USER; }
    }
    return DEFAULT_USER;
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('syncup_settings');
    if (saved) {
      try { return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }; } catch { return DEFAULT_SETTINGS; }
    }
    return DEFAULT_SETTINGS;
  });

  // Sync dark mode class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('syncup_darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const updateUser = (fields) => {
    setCurrentUser(prev => {
      const updated = { ...prev, ...fields };
      localStorage.setItem('syncup_currentUser', JSON.stringify(updated));
      return updated;
    });
  };

  const updateSettings = (fields) => {
    setSettings(prev => {
      const updated = { ...prev, ...fields };
      localStorage.setItem('syncup_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    localStorage.removeItem('syncup_currentUser');
    setCurrentUser(DEFAULT_USER);
  };

  const login = (userData) => {
    const user = { ...DEFAULT_USER, ...userData };
    setCurrentUser(user);
    localStorage.setItem('syncup_currentUser', JSON.stringify(user));
  };

  return (
    <ThemeContext.Provider value={{
      darkMode, toggleDarkMode,
      currentUser, updateUser,
      settings, updateSettings,
      logout, login,
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

export default ThemeContext;
