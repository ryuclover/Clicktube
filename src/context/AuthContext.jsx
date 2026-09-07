import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

// P3: cookies (httpOnly) are the auth mechanism. Only the user profile
// is cached in sessionStorage for fast rehydration — never tokens.
const USER_KEY = 'user';

const parseStoredUser = () => {
  const storedUser = sessionStorage.getItem(USER_KEY);
  if (!storedUser) return null;
  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => parseStoredUser());
  // One-time cleanup of legacy token copies from the Bearer era
  useEffect(() => {
    sessionStorage.removeItem('token');
    localStorage.removeItem('token');
    localStorage.removeItem(USER_KEY);
  }, []);

  useEffect(() => {
    if (user) {
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(USER_KEY);
    }
  }, [user]);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      const api = (await import('../api/api')).default;
      await api.post('/auth/logout');
    } catch {
      // ignore — clear local state regardless
    }
    setUser(null);
    sessionStorage.removeItem(USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, token: null, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
