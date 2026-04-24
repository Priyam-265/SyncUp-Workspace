import React, { createContext, useContext, useState, useCallback } from 'react';
import { workspaceAPI } from '../services/api';
import { useTheme } from './ThemeContext';

const WorkspaceContext = createContext();

export const WorkspaceProvider = ({ children }) => {
  const { currentUser } = useTheme();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await workspaceAPI.getAll();
      setWorkspaces(data);
    } catch (error) {
      console.error("Failed to fetch workspaces:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const createWorkspace = async (workspaceData) => {
    try {
      const newWorkspace = await workspaceAPI.create(workspaceData);
      setWorkspaces(prev => [...prev, newWorkspace]);
      return newWorkspace;
    } catch (error) {
      throw error;
    }
  };

  const joinWorkspace = async (code) => {
    try {
      const workspace = await workspaceAPI.joinByCode(code);
      // Update workspace list if newly joined
      if (!workspaces.find(w => w._id === workspace._id)) {
        setWorkspaces(prev => [...prev, workspace]);
      }
      return workspace;
    } catch (error) {
      throw error;
    }
  };

  return (
    <WorkspaceContext.Provider value={{ 
      workspaces, 
      loading, 
      fetchWorkspaces,
      createWorkspace,
      joinWorkspace
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
};

export default WorkspaceContext;
