import type { Course } from "@/lib/types";
import { apiFetch } from "./client";

export type QuizQuestion = { question: string; options: string[]; correctIndex: number };
export type LessonQuizInput = { questions: QuizQuestion[] };
export type LessonInput = { title: string; duration: string; videoUrl?: string; quiz?: LessonQuizInput };
export type CurriculumSection = { section: string; lessons: LessonInput[] };
export type QuizInput = { id?: string; title: string; questions: QuizQuestion[]; lessonKey?: string };

export type CreateCoursePayload = {
  title: string;
  description: string;
  longDescription: string;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  isFree?: boolean;
  price: number;
  originalPrice?: number;
  duration: string;
  imageUrl?: string;
  videoUrl?: string;
  thumbnail?: string;
  badge?: string;
  objectives: string[];
  curriculum: CurriculumSection[];
  quizzes?: QuizInput[];
};

export async function fetchInstructorCourses() {
  return apiFetch<{ courses: (Course & { status: string; quizzes?: QuizInput[] })[] }>("/api/instructor/courses");
}

export async function fetchCoursePreview(slug: string) {
  return apiFetch<{
    course: Course;
    status: string;
    instructorId?: string;
    quizzes: QuizInput[];
    related: Course[];
  }>(`/api/instructor/courses/preview/${slug}`);
}

export async function createInstructorCourse(data: CreateCoursePayload) {
  return apiFetch<{ course: Course; status: string; message: string }>("/api/instructor/courses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function createAdminCourse(data: CreateCoursePayload) {
  return apiFetch<{ course: Course; status: string; message: string }>("/api/admin/courses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateInstructorCourse(id: string, data: CreateCoursePayload) {
  return apiFetch<{ course: Course; status: string; message: string }>(`/api/instructor/courses/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function updateAdminCourse(id: string, data: CreateCoursePayload) {
  return apiFetch<{ course: Course; status: string; message: string }>(`/api/admin/courses/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteInstructorCourse(courseId: string) {
  return apiFetch<{ message: string }>(`/api/instructor/courses/${courseId}`, { method: "DELETE" });
}

export function courseToFormValues(course: Course & { quizzes?: QuizInput[] }): CreateCoursePayload {
  return {
    title: course.title,
    description: course.description,
    longDescription: course.longDescription,
    category: course.category,
    level: course.level,
    isFree: course.isFree ?? course.price === 0,
    price: course.price,
    originalPrice: course.originalPrice,
    duration: course.duration,
    imageUrl: course.imageUrl,
    videoUrl: course.videoUrl,
    thumbnail: course.thumbnail,
    badge: course.badge,
    objectives: course.objectives,
    curriculum: course.curriculum.map((s) => ({
      section: s.section,
      lessons: s.lessons.map((l) => ({
        title: l.title,
        duration: l.duration,
        videoUrl: l.videoUrl ?? "",
        ...(l.quiz?.questions?.length ? { quiz: { questions: l.quiz.questions } } : {}),
      })),
    })),
    quizzes: course.quizzes
      ?.filter((q) => !q.lessonKey)
      .map((q) => ({ title: q.title, questions: q.questions })),
  };
}
