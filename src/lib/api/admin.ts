import type { Course, TeamMember, Testimonial } from "@/lib/types";
import { apiFetch } from "./client";

export type AdminStats = {
  users: number;
  courses: number;
  enrollments: number;
  messages: number;
  subscribers: number;
  pendingCourses: number;
  paidOrders: number;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export type AdminMessage = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
};

export type AdminEnrollment = {
  id: string;
  progress: number;
  enrolledAt: string;
  userName: string;
  userEmail: string;
  courseTitle: string;
};

export type AdminOrder = {
  id: string;
  userName: string;
  userEmail: string;
  amount: number;
  status: string;
  ussdCode?: string;
  courseTitle: string;
  courseId: string;
  userId: string;
  createdAt: string;
  paidAt?: string;
};

export async function fetchAdminStats() {
  return apiFetch<AdminStats>("/api/admin/stats");
}

export async function fetchAdminUsers() {
  return apiFetch<{ users: AdminUser[] }>("/api/admin/users");
}

export async function fetchAdminCourses() {
  return apiFetch<{ courses: (Course & { status?: string })[] }>("/api/admin/courses");
}

export async function fetchAdminMessages() {
  return apiFetch<{ messages: AdminMessage[] }>("/api/admin/messages");
}

export async function fetchAdminEnrollments() {
  return apiFetch<{ enrollments: AdminEnrollment[] }>("/api/admin/enrollments");
}

export async function fetchAdminOrders() {
  return apiFetch<{ orders: AdminOrder[] }>("/api/admin/orders");
}

export async function approveOrder(orderId: string) {
  return apiFetch<{ message: string }>(`/api/admin/orders/${orderId}/approve`, { method: "POST" });
}

export async function unapproveOrder(orderId: string) {
  return apiFetch<{ message: string }>(`/api/admin/orders/${orderId}/unapprove`, { method: "POST" });
}

export async function updateCourseStatus(courseId: string, status: string) {
  return apiFetch<{ message: string }>(`/api/admin/courses/${courseId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  role: "student" | "instructor" | "admin";
};

export async function createAdminUser(data: CreateUserPayload) {
  return apiFetch<{ message: string; user: AdminUser }>("/api/admin/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(userId: string) {
  return apiFetch<{ message: string }>(`/api/admin/users/${userId}`, { method: "DELETE" });
}

export async function updateUserRole(userId: string, role: string) {
  return apiFetch<{ message: string }>(`/api/admin/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function deleteCourse(courseId: string) {
  return apiFetch<{ message: string }>(`/api/admin/courses/${courseId}`, { method: "DELETE" });
}

export async function fetchAdminTestimonials() {
  return apiFetch<{ testimonials: Testimonial[] }>("/api/admin/testimonials");
}

export async function saveTestimonial(id: string | null, data: Testimonial) {
  if (id) {
    return apiFetch(`/api/admin/testimonials/${id}`, { method: "PUT", body: JSON.stringify(data) });
  }
  return apiFetch("/api/admin/testimonials", { method: "POST", body: JSON.stringify(data) });
}

export async function deleteTestimonial(id: string) {
  return apiFetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
}

export async function fetchAdminTeam() {
  return apiFetch<{ team: TeamMember[] }>("/api/admin/team");
}

export async function saveTeamMember(id: string | null, data: TeamMember) {
  if (id) {
    return apiFetch(`/api/admin/team/${id}`, { method: "PUT", body: JSON.stringify(data) });
  }
  return apiFetch("/api/admin/team", { method: "POST", body: JSON.stringify(data) });
}

export async function deleteTeamMember(id: string) {
  return apiFetch(`/api/admin/team/${id}`, { method: "DELETE" });
}

export async function fetchAdminSettings() {
  return apiFetch<{ settings: Record<string, string> }>("/api/admin/settings");
}

export async function updateAdminSettings(settings: Record<string, string>) {
  return apiFetch("/api/admin/settings", { method: "PUT", body: JSON.stringify(settings) });
}
