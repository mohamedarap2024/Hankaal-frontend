import type { AuthResponse, User } from "@/lib/types";
import { apiFetch } from "./client";

export async function register(name: string, email: string, password: string) {
  return apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function login(email: string, password: string) {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function loginWithGoogle(credential: string) {
  return apiFetch<AuthResponse>("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });
}

export async function getMe() {
  return apiFetch<{ user: User }>("/api/auth/me");
}

export async function updateProfile(data: { name?: string; avatarUrl?: string }) {
  return apiFetch<{ user: User }>("/api/auth/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
