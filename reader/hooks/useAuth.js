import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, onAuthStateChange } from "../services/supabaseClient.js";
import { getProfile, signOut as doSignOut } from "../services/authService.js";

// Fallback profile derived from the auth user's metadata when the profiles
// table query fails (e.g. schema not applied yet).
function profileFromUser(user) {
  if (!user) return null;
  const meta = user.user_metadata || {};
  return {
    id: user.id,
    name: meta.name || user.email?.split("@")[0] || "User",
    email: user.email || "",
    email_verified: Boolean(user.email_confirmed_at),
    avatar_url: meta.avatar_url || null,
    avatar_color: meta.avatar_color || null,
  };
}

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
        if (!cancelled) setProfile(p || profileFromUser(current));
      }
      setLoading(false);
    })();

    const unsubscribe = onAuthStateChange(async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        const p = await getProfile(nextUser.id);
        setProfile(p || profileFromUser(nextUser));
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