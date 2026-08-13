import { supabase, isSupabaseConfigured } from "./supabaseClient.js";

/**
 * Sign in with email + password.
 * Returns { error, errorType } where errorType is one of:
 *   - "email_not_registered" — no account exists for this email
 *   - "invalid_credentials"  — wrong password
 *   - "email_not_verified"   — account exists but email not confirmed
 *   - "generic"              — any other error
 */
export async function signInWithEmail(email, password) {
  if (!isSupabaseConfigured) {
    return { error: "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env", errorType: "generic" };
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (!error) return { error: null, errorType: null };

  const msg = error.message?.toLowerCase() || "";

  // Supabase returns "Invalid login credentials" for both wrong password and
  // unregistered email. We distinguish by checking if the user exists.
  if (msg.includes("invalid login credentials")) {
    const exists = await emailExists(email);
    if (!exists) {
      return { error: "Email not registered. Create account.", errorType: "email_not_registered" };
    }
    return { error: "Invalid credentials.", errorType: "invalid_credentials" };
  }

  if (msg.includes("email not confirmed") || msg.includes("verify")) {
    return { error: "Please verify your email before signing in.", errorType: "email_not_verified" };
  }

  return { error: error.message, errorType: "generic" };
}

/**
 * Probe whether an email is already registered.
 * Supabase's signUp returns a session when the user exists (or an error
 * "User already registered"). We use that to detect existence.
 */
async function emailExists(email) {
  if (!supabase) return false;
  const { data, error } = await supabase.auth.signUp({
    email,
    password: "probe-password-123!",
    options: { data: { name: "probe" } },
  });
  // If a session is returned, the user already exists (signUp with existing
  // email returns the existing user + no session in newer versions).
  if (data?.user && !data?.session) return true;
  if (error?.message?.toLowerCase().includes("already registered")) return true;
  return false;
}

/**
 * Create a new account with email + password + name.
 * Sends a verification email (Supabase's default template uses a /auth/confirm
 * link — one button to verify, no codes).
 */
export async function signUpWithEmail({ email, password, name }) {
  if (!isSupabaseConfigured) {
    return { error: "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env" };
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${window.location.origin}/app`,
    },
  });
  if (error) return { error: error.message };
  if (data?.session) {
    // Session is created immediately when email confirmation is disabled.
    return { error: null, needsVerification: false };
  }
  // No session → the user must verify their email first.
  return { error: null, needsVerification: true };
}

/**
 * Sign in with Google (or the first enabled OAuth provider).
 * Supabase opens the provider's consent screen; after redirect the session
 * is picked up automatically via `detectSessionInUrl`.
 */
export async function signInWithProvider(provider = "google") {
  if (!isSupabaseConfigured) {
    return { error: "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env" };
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/app`,
      // Transparency: only the basic profile is requested, used only to
      // create the account (email for login, name for display).
      scopes: "email profile",
    },
  });
  return { error: error?.message || null };
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/**
 * Send a new verification email (for users who clicked "Resend verification").
 */
export async function resendVerificationEmail(email) {
  if (!isSupabaseConfigured) return { error: "Supabase is not configured." };
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${window.location.origin}/app` },
  });
  return { error: error?.message || null };
}

/**
 * Send a password reset email.
 */
export async function sendPasswordResetEmail(email) {
  if (!isSupabaseConfigured) return { error: "Supabase is not configured." };
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { error: error?.message || null };
}

/**
 * Update the user's password (after reset flow or from profile settings).
 * When `oldPassword` is provided, we re-authenticate first (profile settings).
 */
export async function updatePassword(newPassword, oldPassword) {
  if (!isSupabaseConfigured) return { error: "Supabase is not configured." };

  // If an old password is given, re-authenticate to confirm identity.
  if (oldPassword) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) return { error: "Not signed in." };
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPassword,
    });
    if (reauthError) return { error: "Old password is incorrect." };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error: error?.message || null };
}

/**
 * Update the user's profile (name, avatar).
 */
export async function updateProfile({ name, avatarUrl, avatarColor }) {
  if (!isSupabaseConfigured) return { error: "Supabase is not configured." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (avatarUrl !== undefined) updates.avatar_url = avatarUrl;
  if (avatarColor !== undefined) updates.avatar_color = avatarColor;

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);
  return { error: error?.message || null };
}

/**
 * Delete the user's account (and all associated data via cascade).
 */
export async function deleteAccount() {
  if (!isSupabaseConfigured) return { error: "Supabase is not configured." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  // Delete the profile row (cascades to pdf_files, pdf_metadata, preferences).
  const { error: profileError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", user.id);
  if (profileError) return { error: profileError.message };

  // Delete the auth user via admin API (requires service role — this is a
  // client-side best-effort; in production use a Supabase Edge Function).
  const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
  if (authError) {
    // Fallback: sign out locally; the auth user remains but profile is gone.
    await supabase.auth.signOut();
    return { error: null, partial: true };
  }
  await supabase.auth.signOut();
  return { error: null };
}

/**
 * Fetch the user's profile row (name, email_verified, avatar).
 */
export async function getProfile(userId) {
  if (!supabase || !userId) return null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, email, email_verified, avatar_url, avatar_color")
      .eq("id", userId)
      .maybeSingle();
    if (error) {
      console.warn("Profile fetch failed:", error.message);
      return null;
    }
    return data || null;
  } catch (e) {
    console.warn("Profile fetch error:", e);
    return null;
  }
}
