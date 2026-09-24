import React, { createContext, useContext, useEffect, useState } from 'react';

export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000/api' : '/backend/api');

export function getToken() {
  return localStorage.getItem('raw_admin_token') || '';
}

export function saveToken(token) {
  localStorage.setItem('raw_admin_token', token);
}

export function clearToken() {
  localStorage.removeItem('raw_admin_token');
  localStorage.removeItem('raw_admin_user');
}

export function getSavedUser() {
  try {
    const raw = localStorage.getItem('raw_admin_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveUser(user) {
  try {
    localStorage.setItem('raw_admin_user', JSON.stringify(user));
  } catch {}
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => getToken());
  const [user, setUser] = useState(() => getSavedUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const activeToken = getToken();
    if (!activeToken) {
      setLoading(false);
      return;
    }

    // Validate token with backend /api/auth/me
    fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${activeToken}`,
      },
    })
      .then((res) => {
        if (res.status === 401) {
          // Token is genuinely invalid or expired
          clearToken();
          setToken('');
          setUser(null);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.admin) {
          setUser(data.admin);
          saveUser(data.admin);
        }
      })
      .catch((err) => {
        // Network blip or offline: keep user logged in with cached credentials
        console.warn('Auth check network warning:', err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Login failed');
    }

    saveToken(data.token);
    saveUser(data.admin);
    setToken(data.token);
    setUser(data.admin);
    return data;
  };

  const logout = () => {
    clearToken();
    setToken('');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: Boolean(token),
        loading,
        login,
        logout,
        API_URL,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
