import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getMe, login as apiLogin, register as apiRegister, loginWithGoogle, updateProfile as apiUpdateProfile } from "@/lib/api/auth";
import { setToken } from "@/lib/api/client";
import type { User } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  googleLogin: (credential: string) => Promise<User>;
  updateProfile: (data: { name?: string; avatarUrl?: string }) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("hankaal_token");
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then(({ user }) => setUser(user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await apiRegister(name, email, password);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const googleLogin = useCallback(async (credential: string) => {
    const res = await loginWithGoogle(credential);
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const updateProfile = useCallback(async (data: { name?: string; avatarUrl?: string }) => {
    const res = await apiUpdateProfile(data);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, googleLogin, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
