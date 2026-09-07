import axios from 'axios';
import config from '../config';

const api = axios.create({
  baseURL: config.apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // P0: send httpOnly auth cookies cross-origin
});

// P3: cookies are the auth mechanism — no Bearer tokens in storage.
// Kept as a no-op passthrough so all requests share one place for headers.
api.interceptors.request.use(
  (cfg) => cfg,
  (error) => {
    return Promise.reject(error);
  }
);

let refreshing = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response && error.response.status;
    const url = (original && original.url) || '';
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh');

    // P3: silent refresh once on 401 (except auth routes themselves).
    // New access token arrives via httpOnly cookie — just retry the request.
    if (status === 401 && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        if (!refreshing) {
          refreshing = api.post('/auth/refresh').finally(() => { refreshing = null; });
        }
        await refreshing;
        return api(original);
      } catch (refreshErr) {
        // Refresh failed — clear session and redirect to login
        sessionStorage.removeItem('user');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') window.location.href = '/login';
        return Promise.reject(refreshErr);
      }
    }

    if (status === 401 && isAuthRoute) {
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

// Avatar upload function
export const uploadAvatar = async (file, userId) => {
  const formData = new FormData();
  formData.append('profilePicture', file);
  formData.append('userId', userId);

  try {
    const response = await api.post('/auth/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Avatar upload error:', error);
    throw error;
  }
};

export default api;
