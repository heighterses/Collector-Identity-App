const API_BASE = '/api';

let isRefreshing = false;

const getAuthToken = () => localStorage.getItem('authToken');
const setAuthToken = (token) => localStorage.setItem('authToken', token);
const removeAuthToken = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('token');
};

const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();

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

      const isAuthEndpoint =
        endpoint.includes('/auth/login') ||
        endpoint.includes('/auth/signup') ||
        endpoint.includes('/auth/google');

      if (
        (response.status === 401 || response.status === 403) &&
        token && !isRefreshing && !isAuthEndpoint
      ) {
        isRefreshing = true;
        try {
          const newToken = await auth.refreshToken();
          if (newToken) {
            const retryConfig = {
              ...config,
              headers: { ...config.headers, Authorization: `Bearer ${newToken}` },
            };
            const retryResponse = await fetch(`${API_BASE}${endpoint}`, retryConfig);
            if (retryResponse.ok) return retryResponse.json();
            const retryError = await retryResponse.json().catch(() => ({ error: 'Request failed after token refresh' }));
            throw new Error(retryError.error || 'Request failed after token refresh');
          }
        } catch (refreshError) {
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
    throw fetchError;
  }
};

// ── Auth ─────────────────────────────────────────────────────────────────────
export const auth = {
  signup: async (userData) => {
    removeAuthToken();
    return apiRequest('/auth/signup', { method: 'POST', body: JSON.stringify(userData) });
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

  // Returns { user: { id, email, name, avatar_url, language, timezone, ... } }
  getProfile: async () => apiRequest('/auth/me'),

  logout: () => removeAuthToken(),

  isAuthenticated: () => !!getAuthToken(),

  refreshToken: async () => {
    const token = getAuthToken();
    if (!token) return null;
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const result = await response.json();
        if (result.token) { setAuthToken(result.token); return result.token; }
      }
      removeAuthToken();
      return null;
    } catch {
      removeAuthToken();
      return null;
    }
  },

  validateToken: async () => {
    const token = getAuthToken();
    if (!token) return { valid: false, reason: 'No token found' };
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        return { valid: true, user: data.user };
      }
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      return { valid: false, reason: error.error };
    } catch (error) {
      return { valid: false, reason: error.message };
    }
  },

  updateProfile: async (profileData) =>
    apiRequest('/auth/profile', { method: 'PUT', body: JSON.stringify(profileData) }),

  uploadAvatar: async (formData) => {
    const token = getAuthToken();
    if (!token) throw new Error('Access token required. Please log in again.');
    const response = await fetch(`${API_BASE}/auth/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Avatar upload failed');
    }
    return response.json();
  },

  changePassword: async (passwordData) =>
    apiRequest('/auth/change-password', { method: 'POST', body: JSON.stringify(passwordData) }),

  updatePreferences: async (preferences) =>
    apiRequest('/auth/preferences', { method: 'PUT', body: JSON.stringify(preferences) }),

  exportData: async () => apiRequest('/auth/export-data'),

  deleteAccount: async () => apiRequest('/auth/delete-account', { method: 'DELETE' }),

  completeOnboarding: async () =>
    apiRequest('/auth/complete-onboarding', { method: 'POST' }),

  forgotPassword: async (email) =>
    apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  verifyResetToken: async (token) =>
    apiRequest('/auth/verify-reset-token', { method: 'POST', body: JSON.stringify({ token }) }),

  validateResetToken: async (token) =>
    apiRequest('/auth/validate-reset-token', { method: 'POST', body: JSON.stringify({ token }) }),

  resetPassword: async (token, password) =>
    apiRequest('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
};

// ── Artwork ───────────────────────────────────────────────────────────────────
export const artwork = {
  create: async (artworkData) =>
    apiRequest('/artwork/', { method: 'POST', body: JSON.stringify(artworkData) }),

  createWithFile: async (formData) => {
    const token = getAuthToken();
    if (!token) throw new Error('Access token required. Please log in again.');

    const response = await fetch(`${API_BASE}/artwork/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));

      if (response.status === 401 && !isRefreshing) {
        isRefreshing = true;
        try {
          const newToken = await auth.refreshToken();
          if (newToken) {
            const retryResponse = await fetch(`${API_BASE}/artwork/`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${newToken}` },
              body: formData,
            });
            if (retryResponse.ok) return retryResponse.json();
            const retryError = await retryResponse.json().catch(() => ({ error: 'Network error' }));
            throw new Error(retryError.error || 'Request failed after token refresh');
          }
        } catch (refreshError) {
          removeAuthToken();
          throw new Error('Session expired. Please log in again.');
        } finally {
          isRefreshing = false;
        }
      }

      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  },

  getMine: async () => apiRequest('/artwork/mine'),

  deleteMine: async () => apiRequest('/artwork/mine', { method: 'DELETE' }),
};

// ── Reflection ────────────────────────────────────────────────────────────────
export const reflection = {
  create: async () => apiRequest('/reflection/', { method: 'POST' }),

  getMine: async () => apiRequest('/reflection/mine'),

  getByArtworkId: async (artworkId) => apiRequest(`/reflection/artwork/${artworkId}`),

  refine: async (data) =>
    apiRequest('/reflection/refine', { method: 'POST', body: JSON.stringify(data) }),

  regenerate: async () => apiRequest('/reflection/regenerate', { method: 'POST' }),
};
