import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import LandingPage from '../src/pages/LandingPage';
import LoginPage from '../src/pages/LoginPage';
import RegisterPage from '../src/pages/RegisterPage';
import WorkspaceSelectionPage from '../src/pages/WorkspaceSelectionPage';
import DashboardPage from '../src/pages/DashboardPage';
import SettingsPage from '../src/pages/SettingsPage';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/workspaces" element={<WorkspaceSelectionPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/dashboard/:workspaceId" element={<DashboardPage />} />
          <Route path="/dashboard/:workspaceId/channel/:channelId" element={<DashboardPage />} />
          <Route path="/dashboard/:workspaceId/dm/:userId" element={<DashboardPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;