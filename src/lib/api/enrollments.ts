import type { Enrollment } from "@/lib/types";
import { apiFetch } from "./client";

export async function fetchEnrollments() {
  return apiFetch<{ enrollments: Enrollment[] }>("/api/enrollments");
}

export async function checkEnrollment(courseId: string) {
  return apiFetch<{ enrolled: boolean; enrollmentId?: string; progress?: number }>(
    `/api/enrollments/check/${courseId}`,
  );
}

export async function fetchEnrollmentStats() {
  return apiFetch<{ totalEnrolled: number; avgProgress: number; completed: number }>("/api/enrollments/stats");
}

export async function enrollInCourse(courseId: string) {
  return apiFetch<{ id: string; message: string }>(`/api/enrollments/${courseId}`, { method: "POST" });
}

export async function updateProgress(enrollmentId: string, progress: number) {
  return apiFetch<{ message: string; progress: number }>(`/api/enrollments/${enrollmentId}/progress`, {
    method: "PATCH",
    body: JSON.stringify({ progress }),
  });
}
