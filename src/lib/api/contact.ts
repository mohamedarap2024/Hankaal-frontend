import { apiFetch } from "./client";

export async function sendContactMessage(data: {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}) {
  return apiFetch<{ message: string }>("/api/contact", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function subscribeNewsletter(email: string) {
  return apiFetch<{ message: string }>("/api/contact/newsletter", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}
