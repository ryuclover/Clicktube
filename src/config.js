const normalizeApiUrl = (url) => {
  if (!url) return url;
  // Remove trailing slashes and ensure /api suffix
  const trimmed = url.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const resolveApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) return normalizeApiUrl(envUrl);

  // Production fallback: if running on Vercel (or any non-localhost host),
  // point to the Render backend instead of localhost so the app keeps working
  // even when VITE_API_URL was not set at build time.
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1';
    if (!isLocal) {
      return 'https://clicktube-api.onrender.com/api';
    }
  }

  return 'http://localhost:5000/api';
};

const config = {
  apiUrl: resolveApiUrl(),
  mode: 'production', // Always production in terms of logic now that we removed mock fallback
};

export default config;
