import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI } from '../services/api';

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

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('syncup_darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('syncup_settings');
    if (saved) {
      try { return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }; } catch { return DEFAULT_SETTINGS; }
    }
    return DEFAULT_SETTINGS;
  });

  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

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

  const updateSettings = (fields) => {
    setSettings(prev => {
      const updated = { ...prev, ...fields };
      localStorage.setItem('syncup_settings', JSON.stringify(updated));
      return updated;
    });
  };

  // Check auth status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const userData = await authAPI.getMe();
        setCurrentUser(userData);
      } catch (error) {
        console.log("No active session");
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  const login = async (credentials) => {
    try {
      const data = await authAPI.login(credentials);
      // Backend returns user fields directly, not nested under .user
      setCurrentUser(data);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const data = await authAPI.register(userData);
      // Backend returns user fields directly, not nested under .user
      setCurrentUser(data);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error(err);
    } finally {
      setCurrentUser(null);
    }
  };

  const updateUser = async (id, fields) => {
    try {
      const updatedUser = await userAPI.updateProfile(id, fields);
      setCurrentUser(updatedUser);
      return updatedUser;
    } catch (error) {
      throw error;
    }
  };
  
  const uploadAvatar = async (id, file) => {
    try {
      const result = await userAPI.uploadAvatar(id, file);
      setCurrentUser(prev => ({...prev, avatar: result.avatar}));
      return result;
    } catch (error) {
      throw error;
    }
  };

  const changePassword = async (id, currentPassword, newPassword) => {
    try {
      const result = await userAPI.changePassword(id, currentPassword, newPassword);
      return result;
    } catch (error) {
      throw error;
    }
  };

  return (
    <ThemeContext.Provider value={{
      darkMode, toggleDarkMode,
      settings, updateSettings,
      currentUser, setCurrentUser, authLoading,
      login, register, logout, updateUser, uploadAvatar, changePassword
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
