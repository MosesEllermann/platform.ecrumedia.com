// API configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const config = {
  apiUrl: API_URL,
  apiEndpoint: `${API_URL}/api`,
};

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${config.apiEndpoint}${normalizedPath}`;
};

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper function to make API calls
export const apiClient = {
  get: async (endpoint: string) => {
    const response = await fetch(`${config.apiEndpoint}${endpoint}`, {
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  },

  post: async (endpoint: string, data: any) => {
    const response = await fetch(`${config.apiEndpoint}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  },

  put: async (endpoint: string, data: any) => {
    const response = await fetch(`${config.apiEndpoint}${endpoint}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  },

  delete: async (endpoint: string) => {
    const response = await fetch(`${config.apiEndpoint}${endpoint}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
    return response.json();
  },
};
