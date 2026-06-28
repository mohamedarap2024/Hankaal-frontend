import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RoleAccessLogin } from "@/components/auth/RoleAccessLogin";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { BookOpen, Plus, Clock, Pencil, PlayCircle, Trash2, Users, ShoppingCart, DollarSign, ChevronDown, Mail, UserCircle } from "lucide-react";
import { DashboardLayout, DashboardSection, ContentCard } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { CourseForm } from "@/components/courses/CourseForm";
import { ProfileEditor } from "@/components/site/ProfileEditor";
import {
  fetchInstructorCourses,
  fetchCourseStudents,
  createInstructorCourse,
  updateInstructorCourse,
  deleteInstructorCourse,
  courseToFormValues,
} from "@/lib/api/instructor";
import type { Course } from "@/lib/types";
import type { QuizInput } from "@/lib/api/instructor";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";

export const Route = createFileRoute("/instructor")({
  component: InstructorPage,
});

type InstructorCourse = Course & { status: string; quizzes?: QuizInput[] };
type InstructorSection = "courses" | "create" | "profile";

function InstructorPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Admins have their own panel — keep the instructor area for instructors only.
  useEffect(() => {
    if (!loading && user?.role === "admin") navigate({ to: "/admin" });
  }, [user, loading, navigate]);

  if (loading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading...</div>;
  }

  if (!user) {
    return <RoleAccessLogin role="instructor" />;
  }

  if (user.role !== "instructor") {
    return <RoleAccessLogin role="instructor" accessDenied />;
  }

  return <InstructorDashboard />;
}

function InstructorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [section, setSection] = useState<InstructorSection>("courses");
  const [editingCourse, setEditingCourse] = useState<InstructorCourse | null>(null);
  const [expandedStudents, setExpandedStudents] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["instructor-courses"],
    queryFn: fetchInstructorCourses,
  });

  const courses = data?.courses ?? [];
  const pendingCount = courses.filter((c) => c.status === "pending").length;

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  const createMut = useMutation({
    mutationFn: createInstructorCourse,
    onSuccess: (res) => {
      toast.success(res.message);
      setSection("courses");
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to submit course"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReturnType<typeof courseToFormValues> }) =>
      updateInstructorCourse(id, data),
    onSuccess: (res) => {
      toast.success(res.message);
      setEditingCourse(null);
      setSection("courses");
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to update course"),
  });

  const deleteMut = useMutation({
    mutationFn: deleteInstructorCourse,
    onSuccess: () => {
      toast.success("Course deleted");
      queryClient.invalidateQueries({ queryKey: ["instructor-courses"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to delete course"),
  });

  const openCreate = () => {
    setEditingCourse(null);
    setSection("create");
  };

  const openEdit = (course: InstructorCourse) => {
    setEditingCourse(course);
    setSection("create");
  };

  const navItems = [
    { id: "courses", label: "My Courses", icon: BookOpen, badge: courses.length || undefined },
    { id: "create", label: editingCourse ? "Edit Course" : "Create Course", icon: editingCourse ? Pencil : Plus },
    { id: "profile", label: "Profile", icon: UserCircle },
  ];

  return (
    <DashboardLayout
      panelTitle="Instructor Panel"
      panelSubtitle="Manage your courses"
      navItems={navItems}
      activeId={section}
      onNavigate={(id) => {
        if (id === "create") openCreate();
        else {
          setEditingCourse(null);
          setSection(id as InstructorSection);
        }
      }}
      user={user}
      onLogout={handleLogout}
      headerActions={
        section === "courses" ? (
          <Button variant="hero" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" /> New Course
          </Button>
        ) : undefined
      }
    >
      {section === "courses" && (
        <DashboardSection
          title="My Courses"
          description="Create, view, and edit your courses with images, videos, and quizzes."
        >
          <div className="grid gap-4">
            {courses.map((c) => (
              <ContentCard key={c.id} className="flex flex-wrap items-center gap-4 !p-4 md:!p-5">
                <div
                  className="h-14 w-14 rounded-xl shrink-0 grid place-items-center text-white"
                  style={{ background: c.thumbnail ?? "var(--gradient-hero)" }}
                >
                  <BookOpen className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold">{c.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {c.category} · {c.isFree || c.price === 0 ? "Free" : `$${c.price}`} · {c.lessons} lessons
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {c.enrollments ?? 0} enrolled
                    </span>
                    {!c.isFree && c.price > 0 && (
                      <>
                        <span className="inline-flex items-center gap-1">
                          <ShoppingCart className="h-3.5 w-3.5" /> {c.sales ?? 0} sold
                        </span>
                        <span className="inline-flex items-center gap-1 font-medium text-foreground">
                          <DollarSign className="h-3.5 w-3.5" /> ${c.instructorEarnings ?? 0} earned
                          {c.instructorPercentage ? ` (${c.instructorPercentage}%)` : ""}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <Badge variant={c.status === "published" ? "default" : c.status === "pending" ? "secondary" : "outline"}>
                  {c.status}
                </Badge>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={expandedStudents === c.id ? "default" : "outline"}
                    onClick={() => setExpandedStudents(expandedStudents === c.id ? null : c.id)}
                  >
                    <Users className="h-4 w-4" /> Students
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedStudents === c.id ? "rotate-180" : ""}`} />
                  </Button>
                  <Button size="sm" variant="hero" asChild>
                    <Link to="/learn/$courseId" params={{ courseId: c.slug }}>
                      <PlayCircle className="h-4 w-4" /> Open
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (window.confirm(`Delete "${c.title}"? This removes the course even if students are enrolled.`)) {
                        deleteMut.mutate(c.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {expandedStudents === c.id && (
                  <div className="w-full">
                    <CourseStudents courseId={c.id} />
                  </div>
                )}
              </ContentCard>
            ))}
            {courses.length === 0 && (
              <ContentCard>
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium">No courses yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Create your first complete course to get started.</p>
                  <Button variant="hero" className="mt-4" onClick={openCreate}>
                    <Plus className="h-4 w-4" /> Create Course
                  </Button>
                </div>
              </ContentCard>
            )}
          </div>

          <ContentCard className="mt-6 flex items-start gap-3 text-sm text-muted-foreground !p-4">
            <Clock className="h-5 w-5 shrink-0 mt-0.5 text-primary" />
            <p>
              Courses you submit appear as <strong>pending</strong> until an admin approves and publishes them.
              {pendingCount > 0 && <> You have <strong>{pendingCount}</strong> awaiting approval.</>}
            </p>
          </ContentCard>
        </DashboardSection>
      )}

      {section === "create" && (
        <DashboardSection
          title={editingCourse ? `Editing: ${editingCourse.title}` : "Create New Course"}
          description="Add lessons, videos, images, quizzes, and set paid or free pricing."
        >
          <CourseForm
            key={editingCourse?.id ?? "new"}
            initialValues={editingCourse ? courseToFormValues(editingCourse) : undefined}
            submitLabel={editingCourse ? "Save Changes" : "Submit for Approval"}
            loading={editingCourse ? updateMut.isPending : createMut.isPending}
            onCancel={() => {
              setEditingCourse(null);
              setSection("courses");
            }}
            onSubmit={(formData) => {
              if (editingCourse) {
                updateMut.mutate({ id: editingCourse.id, data: formData });
              } else {
                createMut.mutate(formData);
              }
            }}
          />
        </DashboardSection>
      )}

      {section === "profile" && (
        <DashboardSection title="My Profile" description="Update your name and the photo shown on your courses.">
          <ProfileEditor />
        </DashboardSection>
      )}
    </DashboardLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "approved" ? "default" : status === "paid" ? "secondary" : status === "rejected" ? "destructive" : "outline";
  return <Badge variant={variant} className="text-[10px] capitalize">{status.replace(/_/g, " ")}</Badge>;
}

function CourseStudents({ courseId }: { courseId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["course-students", courseId],
    queryFn: () => fetchCourseStudents(courseId),
  });

  if (isLoading) {
    return <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">Loading students…</div>;
  }

  const enrolled = data?.enrolled ?? [];
  const orders = data?.orders ?? [];
  const approvedOrders = orders.filter((o) => o.status === "approved");
  const requestedOrders = orders.filter((o) => o.status !== "approved");

  return (
    <div className="mt-4 grid gap-4 md:grid-cols-2 rounded-xl border border-border bg-muted/20 p-4">
      <div>
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
          <Users className="h-4 w-4 text-primary" /> Enrolled / Approved ({enrolled.length})
        </h4>
        {enrolled.length === 0 ? (
          <p className="text-xs text-muted-foreground">No students have access yet.</p>
        ) : (
          <ul className="space-y-2">
            {enrolled.map((s, i) => (
              <li key={i} className="flex items-center justify-between gap-2 text-sm rounded-lg bg-card border border-border px-3 py-2">
                <div className="min-w-0">
                  <div className="font-medium truncate">{s.name}</div>
                  <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {s.email}
                  </div>
                </div>
                <span className="text-xs font-medium text-muted-foreground shrink-0">{s.progress}%</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
          <ShoppingCart className="h-4 w-4 text-primary" /> Orders / Requests ({orders.length})
        </h4>
        {orders.length === 0 ? (
          <p className="text-xs text-muted-foreground">No orders yet.</p>
        ) : (
          <ul className="space-y-2">
            {[...requestedOrders, ...approvedOrders].map((o, i) => (
              <li key={i} className="flex items-center justify-between gap-2 text-sm rounded-lg bg-card border border-border px-3 py-2">
                <div className="min-w-0">
                  <div className="font-medium truncate">{o.name}</div>
                  <div className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {o.email}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">${o.amount}</span>
                  <StatusBadge status={o.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
