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
  // OLD (keep for compatibility)
  getMine: async () => apiRequest('/reflection/mine'),

  getByArtworkId: async (artworkId) =>
    apiRequest(`/reflection/artwork/${artworkId}`),

  refine: async (reflection_id, input) =>
    apiRequest('/reflection/refine', {
      method: 'POST',
      body: JSON.stringify({
        reflection_id,
        input,
      }),
    }),

  regenerate: async () =>
    apiRequest('/reflection/regenerate', { method: 'POST' }),

  // 🔥 NEW (PER ARTWORK — MAIN FIX)
  generateForArtwork: async (artworkId) =>
    apiRequest(`/reflection/generate/${artworkId}`, {
      method: 'POST',
    }),
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