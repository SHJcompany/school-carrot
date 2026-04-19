"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AuthUser } from "@/types";
import {
  loadAuthFromStorage,
  saveAuthToStorage,
  clearAuthFromStorage,
  refreshUserPoints,
} from "@/lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  refreshPoints: () => Promise<void>;
  showAuthModal: boolean;
  setShowAuthModal: (v: boolean) => void;
  pendingAction: (() => void) | null;
  requireAuth: (action: () => void) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    const stored = loadAuthFromStorage();
    if (stored) setUser(stored);
  }, []);

  const login = useCallback((u: AuthUser) => {
    setUser(u);
    saveAuthToStorage(u);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    clearAuthFromStorage();
  }, []);

  const refreshPoints = useCallback(async () => {
    if (!user) return;
    const points = await refreshUserPoints(user.id);
    const updated = { ...user, points };
    setUser(updated);
    saveAuthToStorage(updated);
  }, [user]);

  const requireAuth = useCallback(
    (action: () => void) => {
      if (user) {
        action();
      } else {
        setPendingAction(() => action);
        setShowAuthModal(true);
      }
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        refreshPoints,
        showAuthModal,
        setShowAuthModal,
        pendingAction,
        requireAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
