import type { Course } from "@/lib/types";
import { apiFetch } from "./client";

export type CartItem = { id: string; courseId: string; course: Course };

export async function fetchCart() {
  return apiFetch<{ items: CartItem[]; total: number }>("/api/cart");
}

export async function addToCart(courseId: string) {
  return apiFetch<{ id: string; message: string }>(`/api/cart/${courseId}`, { method: "POST" });
}

export async function removeFromCart(courseId: string) {
  return apiFetch<{ message: string }>(`/api/cart/${courseId}`, { method: "DELETE" });
}
