// Frontend API service layer replacing mockData.js

// Using native fetch API for maximum compatibility. 
// Note: Interceptors logic handles JSON unwrapping naturally.

const BASE_URL = '/api';

const defaultHeaders = {
  'Content-Type': 'application/json',
};

// Generic fetch wrapper to handle errors and JSON parsing uniformly
async function fetchClient(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  // If we're sending FormData (like file uploads), remove Content-Type 
  // so fetch can auto-set the correct boundary
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  try {
    const response = await fetch(url, config);
    
    // Attempt to parse JSON response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      throw new Error(data.message || `API Error: ${response.status} ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error(`API Request failed for ${endpoint}:`, error);
    throw error;
  }
}

// -----------------------------------------------------------------------------
// Auth API
// -----------------------------------------------------------------------------
export const authAPI = {
  register: (userData) => fetchClient('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  
  login: (credentials) => fetchClient('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  
  logout: () => fetchClient('/auth/logout', {
    method: 'POST',
  }),
  
  getMe: () => fetchClient('/auth/me', {
    method: 'GET',
  }),
};

// -----------------------------------------------------------------------------
// Workspace API
// -----------------------------------------------------------------------------
export const workspaceAPI = {
  getAll: () => fetchClient('/workspaces', { method: 'GET' }),
  
  getById: (id) => fetchClient(`/workspaces/${id}`, { method: 'GET' }),
  
  create: (data) => fetchClient('/workspaces', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  joinByCode: (code) => fetchClient(`/workspaces/join/${code}`, {
    method: 'POST',
  }),
  
  addMember: (workspaceId, userId) => fetchClient(`/workspaces/${workspaceId}/members`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  }),
};

// -----------------------------------------------------------------------------
// Channel API
// -----------------------------------------------------------------------------
export const channelAPI = {
  getAll: (workspaceId) => fetchClient(`/workspaces/${workspaceId}/channels`, { method: 'GET' }),
  
  getById: (channelId) => fetchClient(`/channels/${channelId}`, { method: 'GET' }),
  
  create: (workspaceId, data) => fetchClient(`/workspaces/${workspaceId}/channels`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  joinByCode: (code) => fetchClient(`/channels/join/${code}`, {
    method: 'POST',
  }),
  
  getOrCreateDm: (workspaceId, userId) => fetchClient(`/workspaces/${workspaceId}/channels/dm/${userId}`, {
    method: 'POST',
  }),
  
  addMember: (channelId, userId) => fetchClient(`/channels/${channelId}/members`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  }),
};

// -----------------------------------------------------------------------------
// Message API
// -----------------------------------------------------------------------------
export const messageAPI = {
  getMessages: (channelId, page = 1, limit = 50) => 
    fetchClient(`/channels/${channelId}/messages?page=${page}&limit=${limit}`, { method: 'GET' }),
  
  sendMessage: async (channelId, text, file = null) => {
    let fileData = {};
    
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetchClient('/upload', {
        method: 'POST',
        body: formData,
      });
      fileData = uploadRes;
    }
    
    return fetchClient(`/channels/${channelId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        text,
        fileUrl: fileData.fileUrl,
        fileType: fileData.fileType,
        fileName: fileData.fileName,
      }),
    });
  },
};

// -----------------------------------------------------------------------------
// User API
// -----------------------------------------------------------------------------
export const userAPI = {
  search: (query) => fetchClient(`/users/search?q=${query}`, { method: 'GET' }),
  
  updateProfile: (id, data) => fetchClient(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  
  uploadAvatar: (id, file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return fetchClient(`/users/${id}/avatar`, {
      method: 'POST',
      body: formData,
    });
  },
};
