import { createClient } from "@supabase/supabase-js";

/**
 * Singleton Supabase client. Reads credentials from Vite env vars
 * (see .env.example). If the vars are missing, the app still works —
 * auth/cloud features are simply disabled and the reader stays local-only.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    })
  : null;

/**
 * Get the currently signed-in user, or null when not configured.
 * Uses getSession() rather than getSessionFromUrl so a logged-in user
 * restored from storage is returned immediately.
 */
export async function getCurrentUser() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;
  return data.session.user;
}

/**
 * Subscribe to auth state changes (sign in, sign out, token refresh).
 * Returns an unsubscribe function.
 */
export function onAuthStateChange(callback) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => data?.subscription?.unsubscribe?.();
}