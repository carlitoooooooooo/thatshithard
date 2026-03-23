import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "./supabase.js";

const AuthContext = createContext(null);

export const AVATAR_COLORS = [
  "#ff2d78", "#ffe600", "#aaff00", "#ff6600",
  "#00cfff", "#bf5fff", "#ff4444", "#00ffaa",
];

const SESSION_KEY = "tsh_session";

// Convert username to email for Supabase Auth
function usernameToEmail(username) {
  return `${username.toLowerCase().replace(/[^a-z0-9._-]/g, "_")}@tsh-app.com`;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Restore session from Supabase on mount, with 8s timeout fallback
  useEffect(() => {
    let settled = false;

    // Show cached session immediately while we verify with Supabase
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) {
        setCurrentUser(JSON.parse(saved));
        setAuthLoading(false); // show app instantly from cache
      }
    } catch {}

    const fallbackTimer = setTimeout(() => {
      if (!settled) {
        settled = true;
        setAuthLoading(false);
      }
    }, 3000); // reduced from 8s to 3s

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (settled) return;
      settled = true;
      clearTimeout(fallbackTimer);

      if (session?.user) {
        await loadAndSetProfile(session.user.id);
      } else {
        // No active session - clear any stale localStorage
        localStorage.removeItem(SESSION_KEY);
      }
      setAuthLoading(false);
    }).catch(() => {
      if (!settled) {
        settled = true;
        clearTimeout(fallbackTimer);
        try {
          const saved = localStorage.getItem(SESSION_KEY);
          if (saved) setCurrentUser(JSON.parse(saved));
        } catch {}
        setAuthLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        localStorage.removeItem(SESSION_KEY);
        setCurrentUser(null);
      } else if (event === "SIGNED_IN" && session?.user) {
        await loadAndSetProfile(session.user.id);
      }
    });

    return () => {
      clearTimeout(fallbackTimer);
      subscription.unsubscribe();
    };
  }, []);

  async function loadAndSetProfile(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return null;

    const user = {
      id: data.id,
      username: data.username,
      avatarColor: data.avatar_color,
      bio: data.bio || "",
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    setCurrentUser(user);
    return user;
  }

  const signup = useCallback(async (username, password, avatarColor, bio) => {
    if (!username || !password) return { error: "Username and password required" };
    if (password.length < 6) return { error: "Password must be at least 6 characters" };
    if (!/^[a-zA-Z0-9._-]{2,30}$/.test(username)) {
      return { error: "Username can only contain letters, numbers, dots, dashes, underscores (2-30 chars)" };
    }

    // Check if username taken
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username.trim())
      .maybeSingle();

    if (existing) return { error: "Username already taken" };

    const email = usernameToEmail(username.trim());

    // Create auth user
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      if (error.message.toLowerCase().includes("rate")) {
        return { error: "Too many signups, wait a minute and try again" };
      }
      return { error: error.message };
    }

    if (!data?.user) {
      return { error: "Signup failed — please try again" };
    }

    // Check if email confirmation is required
    if (data.user.identities && data.user.identities.length === 0) {
      return { error: "Check your email to confirm your account, then log in" };
    }

    // Insert profile row
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: data.user.id,
        username: username.trim(),
        bio: bio || "",
        avatar_color: avatarColor || AVATAR_COLORS[0],
      })
      .select()
      .single();

    if (profileError) {
      // If profile insert fails, clean up the auth user won't happen (no admin key),
      // but at least report the error
      return { error: profileError.message };
    }

    const user = {
      id: profile.id,
      username: profile.username,
      avatarColor: profile.avatar_color,
      bio: profile.bio || "",
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    setCurrentUser(user);
    return { success: true };
  }, []);

  const login = useCallback(async (username, password) => {
    if (!username || !password) return { error: "Username and password required" };

    const email = usernameToEmail(username.trim());

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: "Wrong username or password" };
    }

    if (!data?.user) {
      return { error: "Login failed — please try again" };
    }

    const user = await loadAndSetProfile(data.user.id);
    if (!user) {
      return { error: "Account found but profile missing — contact support" };
    }

    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
    await supabase.auth.signOut();
  }, []);

  const getUserData = useCallback((key) => {
    if (!currentUser) return null;
    try {
      const val = localStorage.getItem(`tsh_${currentUser.username}_${key}`);
      return val ? JSON.parse(val) : null;
    } catch { return null; }
  }, [currentUser]);

  const setUserData = useCallback((key, value) => {
    if (!currentUser) return;
    localStorage.setItem(`tsh_${currentUser.username}_${key}`, JSON.stringify(value));
    if (key === "avatarColor" || key === "bio") {
      const col = key === "avatarColor" ? "avatar_color" : "bio";
      supabase.from("profiles").update({ [col]: value }).eq("id", currentUser.id);
      setCurrentUser(prev => prev ? { ...prev, [key]: value } : prev);
    }
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{ currentUser, authLoading, signup, login, logout, getUserData, setUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
