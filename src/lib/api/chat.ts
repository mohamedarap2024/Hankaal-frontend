import type { ChatMessage } from "@/lib/types";
import { apiFetch } from "./client";

export async function fetchChat(orderId: string) {
  return apiFetch<{ messages: ChatMessage[]; whatsappUrl: string }>(`/api/chat/${orderId}`);
}

export async function sendChatMessage(orderId: string, message: string) {
  return apiFetch<{ id: string; message: string }>(`/api/chat/${orderId}`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}
