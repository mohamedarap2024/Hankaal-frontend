import type { Course, Order } from "@/lib/types";
import { apiFetch } from "./client";

export async function fetchMyOrders() {
  return apiFetch<{ orders: Order[] }>("/api/orders/my");
}

export async function checkout(courseId: string, paymentPhone: string) {
  return apiFetch<{
    order: Order & { course: Course };
    instructions: string;
  }>("/api/orders/checkout", {
    method: "POST",
    body: JSON.stringify({ courseId, paymentPhone }),
  });
}

export async function confirmPayment(orderId: string) {
  return apiFetch<{ message: string; whatsappUrl: string; status: string }>(
    `/api/orders/${orderId}/confirm-payment`,
    { method: "POST" },
  );
}
