const API_BASE = '/api';

// ─────────────────────────────────────────
// TOKEN HANDLING
// ─────────────────────────────────────────
const getAuthToken = () => localStorage.getItem('authToken');

const setAuthToken = (token) => {
  localStorage.setItem('authToken', token);
};

const removeAuthToken = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

// ─────────────────────────────────────────
// CORE REQUEST
// ─────────────────────────────────────────
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();

  const config = {
    headers: {
      ...(options.body && { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, config);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }

  return res.json();
};

// ─────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────
export const auth = {
  signup: async (data) =>
    apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: async (data) => {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (res.token) setAuthToken(res.token);
    return res;
  },

  googleSignIn: async (idToken) => {
    const res = await apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });

    if (res.token) setAuthToken(res.token);
    return res;
  },

  getProfile: async () => apiRequest('/auth/me'),

  logout: () => removeAuthToken(),

  completeOnboarding: async () =>
    apiRequest('/auth/complete-onboarding', {
      method: 'POST',
    }),

  updateProfile: async (data) =>
    apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  uploadAvatar: async (formData) => {
    const token = getAuthToken();
    if (!token) throw new Error('Authentication required');
    const res = await fetch('/api/auth/avatar', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Upload failed');
    }
    return res.json();
  },

  changePassword: async (data) =>
    apiRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePreferences: async (data) =>
    apiRequest('/auth/preferences', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  exportData: async () => apiRequest('/auth/export-data'),

  deleteAccount: async () =>
    apiRequest('/auth/delete-account', { method: 'DELETE' }),
};

// ─────────────────────────────────────────
// ARTWORK (MULTI SUPPORT READY)
// ─────────────────────────────────────────
export const artwork = {
  createWithFile: async (formData) => {
    const token = getAuthToken();

    if (!token) throw new Error('Authentication required');

    const res = await fetch(`${API_BASE}/artwork/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(err.error || 'Upload failed');
    }

    return res.json();
  },

  getMine: async () => apiRequest('/artwork/mine'),

  deleteMine: async (id) =>
    apiRequest(`/artwork/${id}`, { method: 'DELETE' }),
};

// ─────────────────────────────────────────
// REFLECTION
// ─────────────────────────────────────────
export const reflection = {
  // Latest reflection for the user's most recent artwork
  getMine: async () => apiRequest('/reflection/mine'),

  // Reflection for a specific artwork — returns null instead of throwing on 404
  getByArtworkId: async (artworkId) => {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/reflection/artwork/${artworkId}`, {
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    });
    if (res.status === 404) return null;
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(err.error || 'Request failed');
    }
    return res.json();
  },

  // All reflections across all artworks
  getAll: async () => apiRequest('/reflection/all'),

  refine: async (reflection_id, input) =>
    apiRequest('/reflection/refine', {
      method: 'POST',
      body: JSON.stringify({ reflection_id, input }),
    }),

  regenerate: async () =>
    apiRequest('/reflection/regenerate', { method: 'POST' }),

  generateForArtwork: async (artworkId) =>
    apiRequest(`/reflection/generate/${artworkId}`, { method: 'POST' }),
};

// ─────────────────────────────────────────
// IDENTITY (AI CORE)
// ─────────────────────────────────────────
export const identity = {
  generate: async (reflection) =>
    apiRequest('/identity/generate', {
      method: 'POST',
      body: JSON.stringify({ reflection }),
    }),

  refine: async (identity, input) =>
    apiRequest('/identity/refine', {
      method: 'POST',
      body: JSON.stringify({ identity, input }),
    }),

  getProfileData: async () =>
    apiRequest('/identity/profile-data'),
};