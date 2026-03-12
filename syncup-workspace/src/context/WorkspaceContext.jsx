import React, { createContext, useContext, useState, useCallback } from 'react';

const WorkspaceContext = createContext();

const generateCode = () => Math.random().toString(36).substring(2, 10).toUpperCase();

export const WorkspaceProvider = ({ children }) => {
  // Map of invite code -> workspaceId, stored in state (and localStorage for persistence)
  const [inviteCodes, setInviteCodes] = useState(() => {
    try {
      const saved = localStorage.getItem('syncup_inviteCodes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const persistCodes = (codes) => {
    setInviteCodes(codes);
    localStorage.setItem('syncup_inviteCodes', JSON.stringify(codes));
  };

  // Generate an invite code for a workspace and store it
  const createInvite = useCallback((workspaceId) => {
    const code = generateCode();
    const link = `https://syncup.io/join/${code}`;
    setInviteCodes(prev => {
      const updated = { ...prev, [code]: workspaceId };
      localStorage.setItem('syncup_inviteCodes', JSON.stringify(updated));
      return updated;
    });
    return { code, link };
  }, []);

  // Look up a workspace ID from an invite code or link
  const resolveInvite = useCallback((input) => {
    const trimmed = input.trim();
    // Extract code from link if needed
    let code = trimmed;
    if (trimmed.startsWith('http')) {
      const parts = trimmed.split('/');
      code = parts[parts.length - 1];
    }
    code = code.toUpperCase();
    return inviteCodes[code] || null;
  }, [inviteCodes]);

  return (
    <WorkspaceContext.Provider value={{ inviteCodes, createInvite, resolveInvite }}>
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
