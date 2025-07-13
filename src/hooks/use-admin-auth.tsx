// src/hooks/use-admin-auth.tsx
"use client";

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';

interface User {
  email: string;
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// A simple in-memory "session" store for this example.
// In a real app, this would be a secure, server-validated session.
let memoryState: { isAuthenticated: boolean; user: User | null } = {
  isAuthenticated: false,
  user: null,
};

// Check if sessionStorage is available
const hasSessionStorage = typeof window !== 'undefined' && window.sessionStorage;

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // On mount, try to load session from sessionStorage
    if (hasSessionStorage) {
      try {
        const storedAuth = sessionStorage.getItem('admin_auth');
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          if (authData.isAuthenticated && authData.user) {
            setIsAuthenticated(true);
            setUser(authData.user);
            memoryState = authData;
          }
        }
      } catch (e) {
        console.error("Could not parse admin auth session storage.", e);
        sessionStorage.removeItem('admin_auth');
      }
    }
  }, []);

  const login = useCallback((email: string, pass: string): boolean => {
    // This is where you'd have a secure check. For now, we use env variables.
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const adminPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

    if (email === adminEmail && pass === adminPass) {
      const userData = { email };
      setIsAuthenticated(true);
      setUser(userData);
      memoryState = { isAuthenticated: true, user: userData };
      if (hasSessionStorage) {
          try {
            sessionStorage.setItem('admin_auth', JSON.stringify(memoryState));
          } catch(e) {
            console.error("Could not save to session storage", e);
          }
      }
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUser(null);
    memoryState = { isAuthenticated: false, user: null };
     if (hasSessionStorage) {
         try {
            sessionStorage.removeItem('admin_auth');
         } catch(e) {
             console.error("Could not remove item from session storage", e);
         }
     }
  }, []);

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
