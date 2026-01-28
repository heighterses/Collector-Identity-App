const API_BASE = '/api';

// Get auth token from localStorage
const getAuthToken = () => localStorage.getItem('authToken');

// Set auth token in localStorage
const setAuthToken = (token) => localStorage.setItem('authToken', token);

// Remove auth token from localStorage and clean up any other auth-related storage
const removeAuthToken = () => {
  localStorage.removeItem('authToken');
  // Clean up any other potential auth storage
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('token');
};

// API request helper with auth
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  console.log('API Request:', endpoint, 'Token:', token ? 'Present' : 'Missing');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    console.log('API Error:', endpoint, error);
    throw new Error(error.error || 'Request failed');
  }
  
  return response.json();
};

// Auth API
export const auth = {
  signup: async (userData) => {
    // CRITICAL: Ensure no auth state exists before signup
    removeAuthToken();
    
    const result = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    // CRITICAL: Ensure no token is set after signup
    // Signup does NOT log user in - just returns success message
    return result;
  },

  login: async (credentials) => {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    setAuthToken(result.token);
    return result;
  },

  googleSignIn: async (idToken) => {
    const result = await apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    setAuthToken(result.token);
    return result;
  },

  getProfile: async () => {
    return apiRequest('/auth/me');
  },

  completeOnboarding: async () => {
    return apiRequest('/auth/complete-onboarding', {
      method: 'POST',
    });
  },

  logout: () => {
    removeAuthToken();
  },

  refreshToken: async () => {
    try {
      const result = await apiRequest('/auth/refresh', {
        method: 'POST',
      });
      if (result.token) {
        setAuthToken(result.token);
        return result.token;
      }
      return null;
    } catch (error) {
      // Refresh failed, user needs to login again
      removeAuthToken();
      return null;
    }
  },

  isAuthenticated: () => !!getAuthToken(),
};

// Artwork API
export const artwork = {
  create: async (artworkData) => {
    return apiRequest('/artwork', {
      method: 'POST',
      body: JSON.stringify(artworkData),
    });
  },

  createWithFile: async (formData) => {
    const token = getAuthToken();
    console.log('CreateWithFile - Token:', token ? 'Present' : 'Missing');
    
    const config = {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    const response = await fetch(`${API_BASE}/artwork`, {
      method: 'POST',
      body: formData,
      ...config,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      console.log('CreateWithFile Error:', error);
      throw new Error(error.error || 'Request failed');
    }
    
    return response.json();
  },

  getMine: async () => {
    return apiRequest('/artwork/mine');
  },
};

// Reflection API
export const reflection = {
  create: async () => {
    return apiRequest('/reflection', {
      method: 'POST',
    });
  },

  getMine: async () => {
    return apiRequest('/reflection/mine');
  },
};