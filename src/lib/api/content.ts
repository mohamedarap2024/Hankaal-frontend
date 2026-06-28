import type { Faq, Stat, TeamMember, Testimonial } from "@/lib/types";
import { apiFetch } from "./client";

export async function fetchSiteSettings() {
  return apiFetch<{ settings: Record<string, string> }>("/api/content/settings");
}

export async function fetchStats() {
  return apiFetch<{ stats: Stat[] }>("/api/content/stats");
}

export async function fetchTestimonials() {
  return apiFetch<{ testimonials: Testimonial[] }>("/api/content/testimonials");
}

export async function fetchFaqs() {
  return apiFetch<{ faqs: Faq[] }>("/api/content/faqs");
}

export async function fetchTeam() {
  return apiFetch<{ team: TeamMember[] }>("/api/content/team");
}

export type PublicInstructor = {
  id: string;
  name: string;
  avatar: string | null;
  role: "instructor" | "admin";
  courseCount: number;
};

export async function fetchInstructors() {
  return apiFetch<{ instructors: PublicInstructor[] }>("/api/content/instructors");
}
