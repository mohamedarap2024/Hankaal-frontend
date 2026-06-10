import type { Course, Quiz } from "@/lib/types";
import { apiFetch } from "./client";

export async function fetchCourses(params?: { category?: string; search?: string; sort?: string }) {
  const qs = new URLSearchParams();
  if (params?.category) qs.set("category", params.category);
  if (params?.search) qs.set("search", params.search);
  if (params?.sort) qs.set("sort", params.sort);
  const query = qs.toString();
  return apiFetch<{ courses: Course[]; total: number }>(`/api/courses${query ? `?${query}` : ""}`);
}

export async function fetchCourse(slug: string) {
  return apiFetch<{ course: Course; related: Course[] }>(`/api/courses/${slug}`);
}

export async function fetchCourseQuizzes(slug: string) {
  return apiFetch<{ quizzes: Quiz[] }>(`/api/courses/${slug}/quizzes`);
}
