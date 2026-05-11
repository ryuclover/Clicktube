const config = {
  // Use VITE_API_URL from environment variables, or fallback to localhost for development
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  mode: 'production', // Always production in terms of logic now that we removed mock fallback
};

export default config;
