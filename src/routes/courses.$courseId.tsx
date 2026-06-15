import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CheckCircle2, Clock, Globe, PlayCircle, Star, Users, Award, ShieldCheck, HelpCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CourseCard } from "@/components/site/CourseCard";
import { VideoPlayer } from "@/components/courses/VideoPlayer";
import { QuizPanel } from "@/components/courses/QuizPanel";
import { fetchCourse, fetchCourseQuizzes } from "@/lib/api/courses";
import { fetchCoursePreview } from "@/lib/api/instructor";
import { SITE_CONTACT, ussdPaymentHint } from "@/lib/site-contact";
import { addToCart } from "@/lib/api/cart";
import { checkEnrollment, enrollInCourse } from "@/lib/api/enrollments";
import { normalizeCourse } from "@/lib/normalize-course";
import type { Course, Quiz } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api/client";
import { isGradient, resolveMediaUrl } from "@/lib/media";
import { WhatsAppLink } from "@/components/site/WhatsAppLink";
import { toast } from "sonner";

type LoaderData = {
  course: Course | null;
  related: Course[];
  quizzes: Quiz[];
  slug: string;
  isPreview: boolean;
};

export const Route = createFileRoute("/courses/$courseId")({
  loader: async ({ params }) => {
    try {
      const data = await fetchCourse(params.courseId);
      let quizzes: Quiz[] = [];
      try {
        const quizData = await fetchCourseQuizzes(params.courseId);
        quizzes = quizData.quizzes;
      } catch {
        quizzes = [];
      }
      return {
        course: normalizeCourse(data.course),
        related: data.related.map(normalizeCourse),
        quizzes,
        slug: params.courseId,
        isPreview: false,
      } satisfies LoaderData;
    } catch {
      return { course: null, related: [], quizzes: [], slug: params.courseId, isPreview: true } satisfies LoaderData;
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData?.course
      ? [
          { title: `${loaderData.course.title} — Hankaal College` },
          { name: "description", content: loaderData.course.description },
        ]
      : [{ title: "Course — Hankaal College" }],
  }),
  component: CourseDetails,
  notFoundComponent: () => (
    <SiteShell><div className="container mx-auto px-4 py-32 text-center"><h1 className="text-3xl font-bold">Course not found</h1></div></SiteShell>
  ),
});

function CourseDetails() {
  const loaderData = Route.useLoaderData() as LoaderData;
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);

  const isStaff = !!user && ["admin", "instructor"].includes(user.role);
  const needsPreview = loaderData.isPreview;

  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ["course-preview", loaderData.slug],
    queryFn: () => fetchCoursePreview(loaderData.slug),
    enabled: !authLoading && isStaff,
    retry: false,
  });

  const rawCourse = loaderData.course ?? staffData?.course ?? null;
  const course = rawCourse ? normalizeCourse(rawCourse) : null;
  const rawQuizzes = loaderData.quizzes.length > 0 ? loaderData.quizzes : (staffData?.quizzes ?? []);
  const quizzes: Quiz[] = rawQuizzes.map((q, i) => ({
    id: q.id ?? `quiz-${i}`,
    title: q.title,
    questions: q.questions,
  }));
  const related = loaderData.related;
  const courseStatus = staffData?.status;

  const { data: enrollmentData, isLoading: enrollLoading } = useQuery({
    queryKey: ["enrollment-check", course?.id],
    queryFn: () => checkEnrollment(course!.id),
    enabled: !!user && !!course && !authLoading && !isStaff,
  });

  const isPageLoading =
    authLoading ||
    (isStaff && !course && staffLoading) ||
    (!!course && !!user && !isStaff && enrollLoading);

  if (isPageLoading) {
    return <SiteShell><div className="container py-20 text-center text-muted-foreground">Loading course...</div></SiteShell>;
  }

  if (!course) {
    if (needsPreview && !isStaff) throw notFound();
    return <SiteShell><div className="container py-20 text-center"><h1 className="text-3xl font-bold">Course not found</h1></div></SiteShell>;
  }

  const instructorId = staffData?.instructorId;
  const isEnrolled = enrollmentData?.enrolled ?? false;
  const isAdmin = user?.role === "admin";
  const isOwner = user?.role === "instructor" && instructorId === user.id;
  const canOpenLearn = isEnrolled || isAdmin || isOwner;
  const isPreviewMode = needsPreview || (!!courseStatus && courseStatus !== "published");

  const coverImage = resolveMediaUrl(course.imageUrl);
  const thumbStyle = isGradient(course.thumbnail) ? course.thumbnail : undefined;

  const isFreeCourse = course.isFree || course.price === 0;

  const handleAddToCart = async () => {
    if (!user) {
      toast.info("Please log in first");
      navigate({ to: "/login" });
      return;
    }
    setAdding(true);
    try {
      if (isFreeCourse) {
        await enrollInCourse(course.id);
        await queryClient.invalidateQueries({ queryKey: ["enrollment-check", course.id] });
        await queryClient.invalidateQueries({ queryKey: ["enrollments"] });
        toast.success("Enrolled! Start learning now.");
        navigate({ to: "/learn/$courseId", params: { courseId: course.slug } });
      } else {
        await addToCart(course.id);
        toast.success("Added to cart!");
        navigate({ to: "/cart" });
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : isFreeCourse ? "Failed to enroll" : "Failed to add to cart";
      toast.error(msg);
    } finally {
      setAdding(false);
    }
  };

  return (
    <SiteShell>
      {isPreviewMode && isStaff && (
        <div className="bg-accent/10 border-b border-accent/30 py-2 text-center text-sm">
          <Badge variant="secondary" className="mr-2">{courseStatus ?? "preview"}</Badge>
          Staff preview — this course is not public yet
        </div>
      )}
      <section className="relative" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4 py-14 grid lg:grid-cols-[1fr_400px] gap-10 text-primary-foreground">
          <div>
            <Badge className="bg-accent text-accent-foreground border-0 mb-4">{course.category}</Badge>
            <h1 className="text-3xl md:text-5xl font-display font-extrabold leading-tight">{course.title}</h1>
            <p className="mt-4 text-primary-foreground/85 text-lg max-w-2xl">{course.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-accent text-accent" /> <strong>{course.rating.toFixed(1)}</strong> ({course.reviews.toLocaleString()} reviews)</span>
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {course.students.toLocaleString()} students</span>
              <span className="flex items-center gap-1.5"><Globe className="h-4 w-4" /> English</span>
            </div>
            <div className="mt-5 flex items-center gap-3">
              <img src={course.instructor.avatar} alt={course.instructor.name} className="h-10 w-10 rounded-full border-2 border-white/30" />
              <div className="text-sm">
                <div>Taught by <strong>{course.instructor.name}</strong></div>
                <div className="opacity-80 text-xs">{course.instructor.title}</div>
              </div>
            </div>
          </div>
          <div className="lg:row-span-2 lg:-mb-32">
            <div className="bg-card text-foreground border border-border rounded-2xl overflow-hidden shadow-[var(--shadow-elegant)] sticky top-24">
              <div className="aspect-video relative overflow-hidden" style={thumbStyle ? { background: thumbStyle } : undefined}>
                <VideoPlayer url={course.videoUrl || course.imageUrl} title={course.title} thumbnail={course.thumbnail} />
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-baseline gap-3">
                  {isFreeCourse ? (
                    <span className="text-3xl font-display font-extrabold text-green-600">Free</span>
                  ) : (
                    <>
                      <span className="text-3xl font-display font-extrabold">${course.price}</span>
                      {course.originalPrice && (
                        <>
                          <span className="text-muted-foreground line-through">${course.originalPrice}</span>
                          <Badge variant="secondary" className="text-accent">{Math.round((1 - course.price / course.originalPrice) * 100)}% off</Badge>
                        </>
                      )}
                    </>
                  )}
                </div>
                {canOpenLearn ? (
                  <Button variant="hero" size="lg" className="w-full" asChild>
                    <Link to="/learn/$courseId" params={{ courseId: course.slug }}>
                      <PlayCircle className="h-4 w-4" /> Start Course — Watch & Quiz
                    </Link>
                  </Button>
                ) : (
                  <Button variant="hero" size="lg" className="w-full" onClick={handleAddToCart} disabled={adding || isPreviewMode}>
                    {adding ? "Please wait..." : isPreviewMode ? "Not Published Yet" : isFreeCourse ? "Enroll Free" : "Add to Cart"}
                  </Button>
                )}
                {isEnrolled && enrollmentData?.progress !== undefined && (
                  <p className="text-xs text-center text-muted-foreground">Your progress: {enrollmentData.progress}%</p>
                )}
                {!canOpenLearn && !isFreeCourse && !isPreviewMode && (
                  <div className="text-xs text-muted-foreground space-y-1 p-3 rounded-lg bg-muted/50">
                    <p><strong>Paid course steps:</strong></p>
                    <p>1. Add to Cart → 2. Pay {ussdPaymentHint(course.price)} on your phone → 3. WhatsApp {SITE_CONTACT.phone} → 4. Start after approval</p>
                  </div>
                )}
                {!canOpenLearn && isFreeCourse && !isPreviewMode && (
                  <p className="text-xs text-center text-muted-foreground">Free — click Enroll Free to start immediately.</p>
                )}
                <WhatsAppLink
                  label="Ask on WhatsApp"
                  variant="button"
                  className="w-full h-11 text-base"
                />
                <div className="pt-2 space-y-2 text-sm">
                  <Row icon={Clock} label="Duration" value={course.duration} />
                  <Row icon={PlayCircle} label="Lessons" value={`${course.lessons} lessons`} />
                  <Row icon={Award} label="Certificate" value="On completion" />
                  <Row icon={ShieldCheck} label="Access" value="Lifetime" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14 grid lg:grid-cols-[1fr_400px] gap-10">
        <div className="space-y-12">
          {coverImage && !isGradient(coverImage) && (
            <img src={coverImage} alt={course.title} className="w-full max-h-80 object-cover rounded-2xl border border-border" />
          )}
          <div>
            <h2 className="text-2xl font-display font-bold mb-4">About this course</h2>
            <p className="text-muted-foreground leading-relaxed">{course.longDescription}</p>
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold mb-5">What you'll learn</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {course.objectives.map((o) => (
                <div key={o} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm">{o}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold mb-5">Course curriculum</h2>
            {course.curriculum.length === 0 ? (
              <p className="text-muted-foreground">Lessons will be added soon.</p>
            ) : (
              <Accordion type="multiple" defaultValue={["s-0"]} className="border border-border rounded-xl divide-y">
                {course.curriculum.map((s, i) => (
                  <AccordionItem key={i} value={`s-${i}`} className="border-0 px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="text-left">
                        <div className="font-semibold">{s.section}</div>
                        <div className="text-xs text-muted-foreground font-normal">{s.lessons.length} lessons</div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2">
                        {s.lessons.map((l, j) => (
                          <li key={j} className="flex items-center justify-between text-sm py-1.5">
                            <span className="flex items-center gap-2">
                              <PlayCircle className="h-4 w-4 text-muted-foreground" />
                              {canOpenLearn ? (
                                <Link to="/learn/$courseId" params={{ courseId: course.slug }} className="hover:text-primary hover:underline">{l.title}</Link>
                              ) : (
                                <span>{l.title}</span>
                              )}
                            </span>
                            <span className="text-muted-foreground">{l.duration}</span>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>
          {canOpenLearn && quizzes.length > 0 ? (
            <QuizPanel quizzes={quizzes} />
          ) : quizzes.length > 0 ? (
            <div>
              <h2 className="text-2xl font-display font-bold mb-5">Course quizzes</h2>
              <div className="space-y-3">
                {quizzes.map((q, i) => (
                  <div key={q.id ?? `quiz-${i}`} className="p-4 rounded-xl border border-border bg-card flex items-center gap-3">
                    <HelpCircle className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <div className="font-semibold">{q.title}</div>
                      <div className="text-xs text-muted-foreground">{q.questions.length} questions — enroll to take</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <div />
      </section>

      {related.length > 0 && (
        <section className="container mx-auto px-4 pb-20">
          <h2 className="text-2xl font-display font-bold mb-6">Related courses</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((c, i) => <CourseCard key={c.id} course={c} index={i} />)}
          </div>
          <div className="text-center mt-10">
            <Button variant="outline" asChild><Link to="/courses">Browse all courses</Link></Button>
          </div>
        </section>
      )}
    </SiteShell>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-muted-foreground"><Icon className="h-4 w-4" /> {label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
