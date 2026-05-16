import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const MIGRATION_KEY = 'auth_storage_migrated_v1';

const getStoredToken = () => {
  const sessionToken = sessionStorage.getItem(TOKEN_KEY);
  if (sessionToken) return sessionToken;
  if (sessionStorage.getItem(MIGRATION_KEY) === '1') return null;
  return localStorage.getItem(TOKEN_KEY);
};

const getStoredUser = () => {
  const sessionUser = sessionStorage.getItem(USER_KEY);
  if (sessionUser) return sessionUser;
  if (sessionStorage.getItem(MIGRATION_KEY) === '1') return null;
  return localStorage.getItem(USER_KEY);
};
const parseStoredUser = () => {
  const storedUser = getStoredUser();
  if (!storedUser) return null;
  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => parseStoredUser());
  const [token, setToken] = useState(getStoredToken);

  useEffect(() => {
    if (sessionStorage.getItem(MIGRATION_KEY) === '1') return;

    if (!sessionStorage.getItem(TOKEN_KEY)) {
      const legacyToken = localStorage.getItem(TOKEN_KEY);
      if (legacyToken) sessionStorage.setItem(TOKEN_KEY, legacyToken);
    }

    if (!sessionStorage.getItem(USER_KEY)) {
      const legacyUser = localStorage.getItem(USER_KEY);
      if (legacyUser) sessionStorage.setItem(USER_KEY, legacyUser);
    }

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.setItem(MIGRATION_KEY, '1');
  }, []);

  useEffect(() => {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(USER_KEY);
    }
  }, [user]);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
