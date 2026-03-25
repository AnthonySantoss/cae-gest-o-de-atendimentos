import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authApi, type AuthUser } from './api.js';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Restaura sessão do localStorage
  useEffect(() => {
    const token = localStorage.getItem('cae_token');
    const userRaw = localStorage.getItem('cae_user');
    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw) as AuthUser;
        setState({ user, token, isAuthenticated: true, isLoading: false });
      } catch {
        localStorage.clear();
        setState(s => ({ ...s, isLoading: false }));
      }
    } else {
      setState(s => ({ ...s, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, senha: string) => {
    const { token, usuario } = await authApi.login(email, senha);
    localStorage.setItem('cae_token', token);
    localStorage.setItem('cae_user', JSON.stringify(usuario));
    setState({ user: usuario, token, isAuthenticated: true, isLoading: false });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('cae_token');
    localStorage.removeItem('cae_user');
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
