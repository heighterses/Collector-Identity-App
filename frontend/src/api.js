const API_BASE = '/api';

// Flag to prevent multiple simultaneous token refresh attempts
let isRefreshing = false;

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

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      console.log('API Error:', endpoint, error);
      
      // If token is invalid/expired, try to refresh it once
      if (response.status === 401 || response.status === 403) {
        if (token && !isRefreshing) {
          console.log('Token might be expired, attempting refresh...');
          isRefreshing = true;
          
          try {
            const newToken = await auth.refreshToken();
            if (newToken) {
              // Retry the original request with new token
              const retryConfig = {
                ...config,
                headers: {
                  ...config.headers,
                  Authorization: `Bearer ${newToken}`
                }
              };
              const retryResponse = await fetch(`${API_BASE}${endpoint}`, retryConfig);
              if (retryResponse.ok) {
                return retryResponse.json();
              } else {
                const retryError = await retryResponse.json().catch(() => ({ error: 'Request failed after token refresh' }));
                throw new Error(retryError.error || 'Request failed after token refresh');
              }
            }
          } catch (refreshError) {
            console.log('Token refresh failed:', refreshError);
            // Force logout if refresh fails
            removeAuthToken();
            throw new Error('Session expired. Please log in again.');
          } finally {
            isRefreshing = false;
          }
        } else {
          // No token or already refreshing
          throw new Error('Access token required. Please log in again.');
        }
      }
      
      throw new Error(error.error || 'Request failed');
    }
    
    return response.json();
  } catch (fetchError) {
    console.log('Fetch Error:', endpoint, fetchError);
    throw fetchError;
  }
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
    const token = getAuthToken();
    if (!token) {
      return null;
    }

    try {
      // Make direct fetch call to avoid infinite loop with apiRequest
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.token) {
          setAuthToken(result.token);
          return result.token;
        }
      }
      
      // If refresh failed, remove token
      removeAuthToken();
      return null;
    } catch (error) {
      console.log('Token refresh error:', error);
      // Refresh failed, user needs to login again
      removeAuthToken();
      return null;
    }
  },

  isAuthenticated: () => !!getAuthToken(),

  // Debug function to check token validity
  validateToken: async () => {
    const token = getAuthToken();
    if (!token) {
      return { valid: false, reason: 'No token found' };
    }
    
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return { valid: true, user: data.user };
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        return { valid: false, reason: error.error };
      }
    } catch (error) {
      return { valid: false, reason: error.message };
    }
  },

  // Force token refresh for debugging
  forceRefresh: async () => {
    console.log('Forcing token refresh...');
    try {
      const newToken = await auth.refreshToken();
      if (newToken) {
        console.log('Token refreshed successfully');
        return { success: true, token: newToken };
      } else {
        console.log('Token refresh failed');
        return { success: false, reason: 'Refresh failed' };
      }
    } catch (error) {
      console.log('Token refresh error:', error);
      return { success: false, reason: error.message };
    }
  },
};

// Artwork API
export const artwork = {
  create: async (artworkData) => {
    return apiRequest('/artwork/', {
      method: 'POST',
      body: JSON.stringify(artworkData),
    });
  },

  createWithFile: async (formData) => {
    const token = getAuthToken();
    console.log('CreateWithFile - Token:', token ? 'Present' : 'Missing');
    
    if (!token) {
      throw new Error('Access token required. Please log in again.');
    }

    const config = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    };

    try {
      const response = await fetch(`${API_BASE}/artwork/`, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        console.log('CreateWithFile Error:', error);
        
        // If token is invalid/expired, try to refresh it once
        if (response.status === 401 && !isRefreshing) {
          console.log('Token might be expired, attempting refresh...');
          isRefreshing = true;
          
          try {
            const newToken = await auth.refreshToken();
            if (newToken) {
              // Retry the original request with new token
              const retryConfig = {
                ...config,
                headers: {
                  ...config.headers,
                  Authorization: `Bearer ${newToken}`
                }
              };
              const retryResponse = await fetch(`${API_BASE}/artwork/`, retryConfig);
              if (retryResponse.ok) {
                return retryResponse.json();
              } else {
                const retryError = await retryResponse.json().catch(() => ({ error: 'Network error' }));
                throw new Error(retryError.error || 'Request failed after token refresh');
              }
            }
          } catch (refreshError) {
            console.log('Token refresh failed:', refreshError);
            // Force logout if refresh fails
            removeAuthToken();
            throw new Error('Session expired. Please log in again.');
          } finally {
            isRefreshing = false;
          }
        }
        
        throw new Error(error.error || 'Request failed');
      }
      
      return response.json();
    } catch (fetchError) {
      console.log('CreateWithFile Fetch Error:', fetchError);
      throw fetchError;
    }
  },

  getMine: async () => {
    return apiRequest('/artwork/mine');
  },

  deleteMine: async () => {
    console.log('Deleting artwork...');
    const token = getAuthToken();
    console.log('Token for artwork deletion:', token ? 'Present' : 'Missing');
    
    if (!token) {
      throw new Error('Access token required. Please log in again.');
    }
    
    try {
      const result = await apiRequest('/artwork/mine', {
        method: 'DELETE',
      });
      console.log('Artwork deleted successfully:', result);
      return result;
    } catch (error) {
      console.error('Artwork deletion failed:', error);
      throw error;
    }
  },
};

// Reflection API
export const reflection = {
  create: async () => {
    console.log('Creating reflection...');
    const token = getAuthToken();
    console.log('Token for reflection creation:', token ? 'Present' : 'Missing');
    
    if (!token) {
      throw new Error('Access token required. Please log in again.');
    }
    
    try {
      const result = await apiRequest('/reflection/', {
        method: 'POST',
      });
      console.log('Reflection created successfully:', result);
      return result;
    } catch (error) {
      console.error('Reflection creation failed:', error);
      throw error;
    }
  },

  getMine: async () => {
    return apiRequest('/reflection/mine');
  },
};