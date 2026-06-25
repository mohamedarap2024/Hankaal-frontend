import { createFileRoute, Link, redirect, notFound } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, PlayCircle, BookOpen, HelpCircle, Video, Award } from "lucide-react";
import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideoPlayer } from "@/components/courses/VideoPlayer";
import { QuizPanel } from "@/components/courses/QuizPanel";
import { CertificateButton } from "@/components/courses/CertificateButton";
import { fetchCourse, fetchCourseQuizzes } from "@/lib/api/courses";
import { fetchCoursePreview } from "@/lib/api/instructor";
import { checkEnrollment, updateProgress } from "@/lib/api/enrollments";
import { normalizeCourse } from "@/lib/normalize-course";
import { loadCourseProgress, saveCourseProgress, markCourseDone } from "@/lib/course-progress";
import { useAuth } from "@/contexts/AuthContext";
import type { Course, Quiz } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/learn/$courseId")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !localStorage.getItem("hankaal_token")) {
      throw redirect({ to: "/login" });
    }
  },
  loader: async ({ params }) => {
    try {
      const data = await fetchCourse(params.courseId);
      return { course: normalizeCourse(data.course), slug: params.courseId, isPreview: false };
    } catch {
      return { course: null, slug: params.courseId, isPreview: true };
    }
  },
  component: CourseLearnPage,
});

type FlatLesson = {
  section: string;
  title: string;
  duration: string;
  videoUrl?: string;
  index: number;
  quiz?: { questions: { question: string; options: string[]; correctIndex: number }[] };
};

function flattenLessons(course: Course): FlatLesson[] {
  const lessons: FlatLesson[] = [];
  let index = 0;
  for (const section of course.curriculum) {
    for (const lesson of section.lessons) {
      lessons.push({ section: section.section, ...lesson, index });
      index++;
    }
  }
  return lessons;
}

function CourseLearnPage() {
  const loaderData = Route.useLoaderData() as { course: Course | null; slug: string; isPreview: boolean };
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [activeIndex, setActiveIndex] = useState(0);
  const [tab, setTab] = useState("lessons");
  const [watched, setWatched] = useState<Set<number>>(new Set());
  const [completedQuizzes, setCompletedQuizzes] = useState<Set<string>>(new Set());
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const isStaff = !!user && ["admin", "instructor"].includes(user.role);
  const previewCourse = loaderData.course ? normalizeCourse(loaderData.course) : null;

  const { data: enrollmentData, isLoading: enrollLoading } = useQuery({
    queryKey: ["enrollment-check", previewCourse?.id],
    queryFn: () => checkEnrollment(previewCourse!.id),
    enabled: !!previewCourse && !authLoading && !isStaff,
  });

  const isEnrolled = enrollmentData?.enrolled ?? false;

  const { data: fullCourseData, isLoading: fullCourseLoading } = useQuery({
    queryKey: ["learn-full", loaderData.slug],
    queryFn: () => fetchCourse(loaderData.slug),
    enabled: !authLoading && isEnrolled && !isStaff,
  });

  const { data: staffMeta, isLoading: staffLoading } = useQuery({
    queryKey: ["learn-staff", loaderData.slug],
    queryFn: () => fetchCoursePreview(loaderData.slug),
    enabled: !authLoading && isStaff,
    retry: false,
  });

  const rawCourse = staffMeta?.course ?? fullCourseData?.course ?? previewCourse ?? null;
  const course = rawCourse ? normalizeCourse(rawCourse) : null;

  const { data: publicQuizzes } = useQuery({
    queryKey: ["learn-quizzes", loaderData.slug],
    queryFn: () => fetchCourseQuizzes(loaderData.slug),
    enabled: !!course && !loaderData.isPreview && (isEnrolled || isStaff),
    retry: false,
  });

  const progressMut = useMutation({
    mutationFn: (progress: number) => updateProgress(enrollmentData!.enrollmentId!, progress),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["enrollments"] }),
  });

  // Load this course's saved lesson/quiz completion once it's known.
  const courseId = course?.id;
  useEffect(() => {
    if (!courseId || loadedFor === courseId) return;
    const saved = loadCourseProgress(courseId);
    setWatched(new Set(saved.watched));
    setCompletedQuizzes(new Set(saved.quizzes));
    setLoadedFor(courseId);
  }, [courseId, loadedFor]);

  const isAdmin = user?.role === "admin";
  const instructorId = staffMeta?.instructorId;
  const isOwner = user?.role === "instructor" && instructorId === user.id;

  if (
    authLoading ||
    (isStaff && !course && staffLoading) ||
    (!isStaff && !!previewCourse && enrollLoading) ||
    (!isStaff && isEnrolled && fullCourseLoading)
  ) {
    return <SiteShell><div className="container py-20 text-center text-muted-foreground">Loading course...</div></SiteShell>;
  }

  if (!course) {
    if (!isStaff) throw notFound();
    return <SiteShell><div className="container py-20 text-center"><h1 className="text-2xl font-bold">Course not found</h1></div></SiteShell>;
  }

  const lessons = flattenLessons(course);
  const lessonQuizzes: Quiz[] = lessons.flatMap((l, i) =>
    l.quiz?.questions?.length
      ? [{ id: `lesson-quiz-${i}`, title: `${l.title} Quiz`, questions: l.quiz.questions }]
      : [],
  );
  const rawQuizzes = staffMeta?.quizzes ?? publicQuizzes?.quizzes ?? [];
  const apiQuizzes: Quiz[] = rawQuizzes.map((q, i) => ({
    id: q.id ?? `quiz-${i}`,
    title: q.title,
    questions: q.questions,
    lessonKey: q.lessonKey,
  }));
  const quizzes: Quiz[] = lessonQuizzes.length > 0 ? lessonQuizzes : apiQuizzes;
  const activeLesson = lessons[activeIndex];
  const activeLessonQuiz: Quiz[] = activeLesson?.quiz?.questions?.length
    ? [{ id: `lesson-quiz-${activeIndex}`, title: `${activeLesson.title} Quiz`, questions: activeLesson.quiz.questions }]
    : [];

  const canAccess = isEnrolled || isAdmin || isOwner;

  if (!canAccess) {
    return (
      <SiteShell>
        <div className="container mx-auto px-4 py-20 text-center max-w-md">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Enrollment Required</h1>
          <p className="text-muted-foreground mb-6">
            {course.isFree || course.price === 0
              ? "Enroll on the course page to start learning."
              : "Buy this course first, then you can watch videos and take quizzes."}
          </p>
          <Button variant="hero" asChild>
            <Link to="/courses/$courseId" params={{ courseId: course.slug }}>View Course</Link>
          </Button>
        </div>
      </SiteShell>
    );
  }

  const progress = enrollmentData?.progress ?? 0;

  const requiredQuizIds = quizzes.map((q) => q.id);
  const allLessonsWatched = lessons.length === 0 || lessons.every((_, i) => watched.has(i));
  const allQuizzesDone = requiredQuizIds.every((id) => completedQuizzes.has(id));
  const fullyCompleted = allLessonsWatched && allQuizzesDone;

  const persist = (nextWatched: Set<number>, nextQuizzes: Set<string>) => {
    if (courseId) saveCourseProgress(courseId, { watched: [...nextWatched], quizzes: [...nextQuizzes] });
  };

  const syncDone = (nextWatched: Set<number>, nextQuizzes: Set<string>) => {
    const lessonsOk = lessons.length === 0 || lessons.every((_, i) => nextWatched.has(i));
    const quizzesOk = requiredQuizIds.every((id) => nextQuizzes.has(id));
    if (courseId) markCourseDone(courseId, lessonsOk && quizzesOk);
  };

  const handleQuizComplete = (quizId: string, passed: boolean) => {
    if (!passed || completedQuizzes.has(quizId)) return;
    const next = new Set(completedQuizzes).add(quizId);
    setCompletedQuizzes(next);
    persist(watched, next);
    syncDone(watched, next);
    toast.success("Quiz passed!");
  };

  const markComplete = () => {
    const nextWatched = new Set(watched).add(activeIndex);
    setWatched(nextWatched);
    persist(nextWatched, completedQuizzes);
    syncDone(nextWatched, completedQuizzes);

    if (isEnrolled && enrollmentData?.enrollmentId) {
      const pct = Math.round((nextWatched.size / Math.max(lessons.length, 1)) * 100);
      progressMut.mutate(pct);
      toast.success("Progress saved!");
    } else {
      toast.success("Lesson completed!");
    }
    if (activeIndex < lessons.length - 1) setActiveIndex(activeIndex + 1);
  };

  return (
    <SiteShell>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/courses/$courseId" params={{ courseId: course.slug }}>
              <ArrowLeft className="h-4 w-4" /> Back to course
            </Link>
          </Button>
          {isEnrolled && (
            <div className="flex items-center gap-3 min-w-[200px]">
              <Progress value={progress} className="flex-1 h-2" />
              <span className="text-sm font-medium">{progress}%</span>
            </div>
          )}
        </div>

        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-display font-bold">{course.title}</h1>
          <p className="text-muted-foreground mt-1">Watch lessons, complete the course, and take quizzes below.</p>
        </div>

        {isEnrolled && user && enrollmentData?.enrollmentId && fullyCompleted && (
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-accent/40 bg-accent/10 p-5">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-accent shrink-0" />
              <div>
                <h2 className="font-display font-bold text-lg">Course completed!</h2>
                <p className="text-sm text-muted-foreground">
                  You watched every lesson and passed every quiz. Download your certificate for {course.title}.
                </p>
              </div>
            </div>
            <CertificateButton
              studentName={user.name}
              courseTitle={course.title}
              instructorName={course.instructor.name}
              enrollmentId={enrollmentData.enrollmentId}
              label="Download Certificate"
              className="shrink-0"
            />
          </div>
        )}

        {isEnrolled && !fullyCompleted && (allLessonsWatched || completedQuizzes.size > 0) && (
          <div className="mb-6 rounded-2xl border border-border bg-card p-4 text-sm">
            <p className="font-medium mb-1">Almost there — finish to unlock your certificate:</p>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-muted-foreground">
              <span className={allLessonsWatched ? "text-green-600 font-medium" : ""}>
                {allLessonsWatched ? "✓" : "•"} Lessons watched: {watched.size}/{lessons.length}
              </span>
              {requiredQuizIds.length > 0 && (
                <span className={allQuizzesDone ? "text-green-600 font-medium" : ""}>
                  {allQuizzesDone ? "✓" : "•"} Quizzes passed: {requiredQuizIds.filter((id) => completedQuizzes.has(id)).length}/{requiredQuizIds.length}
                </span>
              )}
            </div>
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="lessons" className="gap-2">
              <Video className="h-4 w-4" /> Lessons ({lessons.length})
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="gap-2">
              <HelpCircle className="h-4 w-4" /> Quizzes ({quizzes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lessons">
            <div className="grid lg:grid-cols-[1fr_300px] gap-6">
              <div>
                <div className="rounded-2xl overflow-hidden border border-border bg-black aspect-video mb-4">
                  <VideoPlayer
                    url={activeLesson?.videoUrl ?? course.videoUrl}
                    title={activeLesson?.title}
                    thumbnail={course.thumbnail}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">{activeLesson?.section ?? "Course"}</p>
                    <h2 className="text-lg font-bold">{activeLesson?.title ?? "Watch preview video above"}</h2>
                    <p className="text-sm text-muted-foreground">{activeLesson?.duration}</p>
                  </div>
                  {lessons.length > 0 && (
                    <Button variant="hero" onClick={markComplete}>
                      <CheckCircle2 className="h-4 w-4" />
                      {activeIndex < lessons.length - 1 ? "Next Lesson" : "Finish"}
                    </Button>
                  )}
                </div>
                {activeLessonQuiz.length > 0 && (
                  <div className="mt-4">
                    <QuizPanel quizzes={activeLessonQuiz} autoStart onComplete={handleQuizComplete} />
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-border bg-card overflow-hidden max-h-[500px] overflow-y-auto">
                <div className="p-3 border-b font-semibold text-sm bg-muted/30">All Lessons</div>
                {lessons.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">No lessons yet — preview video plays above.</p>
                ) : (
                  lessons.map((lesson, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveIndex(idx)}
                      className={`w-full text-left px-3 py-2.5 flex items-center gap-2 text-sm border-b border-border/50 hover:bg-muted/30 ${idx === activeIndex ? "bg-primary/10 text-primary font-medium" : ""}`}
                    >
                      <PlayCircle className="h-4 w-4 shrink-0" />
                      <span className="flex-1 truncate">{lesson.title}</span>
                      {lesson.quiz?.questions?.length ? (
                        <HelpCircle className="h-3.5 w-3.5 text-accent shrink-0" />
                      ) : null}
                    </button>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="quizzes">
            {quizzes.length === 0 ? (
              <div className="text-center py-16 rounded-2xl border border-dashed border-border">
                <HelpCircle className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">No quizzes for this course yet</p>
              </div>
            ) : (
              <QuizPanel quizzes={quizzes} onComplete={handleQuizComplete} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </SiteShell>
  );
}
