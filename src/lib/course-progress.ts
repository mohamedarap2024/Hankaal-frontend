/**
 * Per-course completion tracking stored in the browser, so the certificate is
 * only unlocked once a student has watched every lesson AND completed every quiz.
 * Persisted in localStorage so it survives reloads on the same device.
 */

export type CourseProgress = {
  /** Flat lesson indexes the student has marked complete. */
  watched: number[];
  /** Quiz ids the student has passed. */
  quizzes: string[];
};

const PROGRESS_KEY = (courseId: string) => `hankaal_course_progress_${courseId}`;
const DONE_KEY = (courseId: string) => `hankaal_course_done_${courseId}`;

const EMPTY: CourseProgress = { watched: [], quizzes: [] };

export function loadCourseProgress(courseId: string): CourseProgress {
  if (typeof window === "undefined" || !courseId) return { ...EMPTY };
  try {
    const raw = localStorage.getItem(PROGRESS_KEY(courseId));
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<CourseProgress>;
    return {
      watched: Array.isArray(parsed.watched) ? parsed.watched : [],
      quizzes: Array.isArray(parsed.quizzes) ? parsed.quizzes : [],
    };
  } catch {
    return { ...EMPTY };
  }
}

export function saveCourseProgress(courseId: string, data: CourseProgress): void {
  if (typeof window === "undefined" || !courseId) return;
  try {
    localStorage.setItem(PROGRESS_KEY(courseId), JSON.stringify(data));
  } catch {
    /* storage full / disabled — ignore */
  }
}

/** Simple flag the dashboard reads to decide whether to offer the certificate. */
export function markCourseDone(courseId: string, done: boolean): void {
  if (typeof window === "undefined" || !courseId) return;
  try {
    if (done) localStorage.setItem(DONE_KEY(courseId), "1");
    else localStorage.removeItem(DONE_KEY(courseId));
  } catch {
    /* ignore */
  }
}

export function isCourseDone(courseId: string): boolean {
  if (typeof window === "undefined" || !courseId) return false;
  try {
    return localStorage.getItem(DONE_KEY(courseId)) === "1";
  } catch {
    return false;
  }
}
