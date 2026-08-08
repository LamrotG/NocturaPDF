import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, onAuthStateChange } from "../services/supabaseClient.js";
import { getProfile, signOut as doSignOut } from "../services/authService.js";

const AuthContext = createContext(null);

// Provides the current user + profile and auth actions to the whole app.
// Plain .js (no JSX) — createElement keeps this file usable without a Vite
// JSX-loader override for non-.jsx files.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const current = await getCurrentUser();
      if (cancelled) return;
      setUser(current);
      if (current) {
        const p = await getProfile(current.id);
        if (!cancelled) setProfile(p);
      }
      setLoading(false);
    })();

    const unsubscribe = onAuthStateChange(async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        const p = await getProfile(nextUser.id);
        setProfile(p);
      } else {
        setProfile(null);
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await doSignOut();
    setUser(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({ user, profile, loading, signOut, isSignedIn: Boolean(user) }),
    [user, profile, loading, signOut]
  );

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}