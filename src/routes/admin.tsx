import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RoleAccessLogin } from "@/components/auth/RoleAccessLogin";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  BookOpen, Mail, Trash2, Users, GraduationCap, MessageSquare, Plus, LayoutDashboard, Pencil, PlayCircle, Settings, Receipt, UserCircle,
  Search, DollarSign, TrendingUp, Wallet, UserCheck, CheckCheck,
} from "lucide-react";
import { DashboardLayout, DashboardSection, StatGrid, ContentCard } from "@/components/dashboard/DashboardLayout";
import { AdminOrderCard } from "@/components/site/AdminOrderCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchAdminStats, fetchAdminUsers, fetchAdminCourses, fetchAdminMessages,
  fetchAdminEnrollments, fetchAdminOrders, updateCourseStatus,
  deleteUser, deleteCourse, updateUserRole,
  fetchAdminTestimonials, saveTestimonial, deleteTestimonial,
  fetchAdminTeam, saveTeamMember, deleteTeamMember,
  fetchAdminSettings, updateAdminSettings, createAdminUser,
  deleteOrder, deleteEnrollment, deleteMessage, approveOrder,
} from "@/lib/api/admin";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { CourseForm } from "@/components/courses/CourseForm";
import { createAdminCourse, updateAdminCourse, courseToFormValues } from "@/lib/api/instructor";
import { ProfileEditor } from "@/components/site/ProfileEditor";
import { formatDate, formatDateTime } from "@/lib/format";
import type { Course } from "@/lib/types";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Hankaal College" },
      { name: "description", content: "Manage users, courses, and platform data." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">Loading...</div>
    );
  }

  if (!user) {
    return <RoleAccessLogin role="admin" />;
  }

  if (user.role !== "admin") {
    return <RoleAccessLogin role="admin" accessDenied />;
  }

  return <AdminDashboard />;
}

type AdminSection =
  | "overview" | "orders" | "users" | "students" | "instructors"
  | "courses" | "enrollments" | "messages" | "finance" | "cms" | "profile";

type Expense = { id: string; label: string; amount: number; date: string };

const EXPENSES_KEY = "hankaal_admin_expenses";
function loadExpenses(): Expense[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(EXPENSES_KEY) || "[]");
  } catch {
    return [];
  }
}

function periodKey(date: string, mode: "week" | "month" | "year"): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  if (mode === "year") return String(d.getFullYear());
  if (mode === "month") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  // ISO week
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [section, setSection] = useState<AdminSection>("overview");
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserRole, setNewUserRole] = useState<"student" | "instructor" | "admin">("student");
  const [editingCourse, setEditingCourse] = useState<(Course & { status?: string }) | null>(null);

  // Search / filter state for the various sections.
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");
  const [courseStatus, setCourseStatus] = useState("all");
  const [enrollSearch, setEnrollSearch] = useState("");
  const [msgSearch, setMsgSearch] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [instructorSearch, setInstructorSearch] = useState("");
  const [financeMode, setFinanceMode] = useState<"week" | "month" | "year">("month");
  const [expenses, setExpenses] = useState<Expense[]>(loadExpenses);

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  const { data: stats } = useQuery({ queryKey: ["admin-stats"], queryFn: fetchAdminStats });
  const { data: usersData } = useQuery({ queryKey: ["admin-users"], queryFn: fetchAdminUsers });
  const { data: coursesData } = useQuery({ queryKey: ["admin-courses"], queryFn: fetchAdminCourses });
  const { data: messagesData } = useQuery({ queryKey: ["admin-messages"], queryFn: fetchAdminMessages });
  const { data: enrollmentsData } = useQuery({ queryKey: ["admin-enrollments"], queryFn: fetchAdminEnrollments });
  const { data: ordersData } = useQuery({ queryKey: ["admin-orders"], queryFn: fetchAdminOrders });
  const { data: testimonialsData } = useQuery({ queryKey: ["admin-testimonials"], queryFn: fetchAdminTestimonials });
  const { data: teamData } = useQuery({ queryKey: ["admin-team"], queryFn: fetchAdminTeam });
  const { data: settingsData } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: fetchAdminSettings,
  });

  const deleteUserMut = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("User deleted"); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed"),
  });

  const deleteCourseMut = useMutation({
    mutationFn: deleteCourse,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-courses"] }); toast.success("Course deleted"); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed"),
  });

  const courseStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateCourseStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success("Course status updated");
    },
  });

  const updateRoleMut = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => updateUserRole(id, role),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Role updated"); },
  });

  const deleteOrderMut = useMutation({
    mutationFn: deleteOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Order deleted");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed"),
  });

  const deleteEnrollmentMut = useMutation({
    mutationFn: deleteEnrollment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Enrollment removed");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed"),
  });

  const deleteMessageMut = useMutation({
    mutationFn: deleteMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-messages"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Message deleted");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed"),
  });

  const createUserMut = useMutation({
    mutationFn: createAdminUser,
    onSuccess: (res) => {
      toast.success(res.message);
      setShowCreateUser(false);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to create user"),
  });

  const createCourseMut = useMutation({
    mutationFn: createAdminCourse,
    onSuccess: (res) => {
      toast.success(res.message);
      setShowCourseForm(false);
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to create course"),
  });

  const updateCourseMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReturnType<typeof courseToFormValues> }) =>
      updateAdminCourse(id, data),
    onSuccess: (res) => {
      toast.success(res.message);
      setEditingCourse(null);
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Failed to update course"),
  });

  const allOrders = ordersData?.orders ?? [];
  const allUsers = usersData?.users ?? [];
  const allCourses = coursesData?.courses ?? [];
  const allEnrollments = enrollmentsData?.enrollments ?? [];
  const allMessages = messagesData?.messages ?? [];

  // Map a user's phone from the orders they placed (users have no phone field).
  const phoneByUser = useMemo(() => {
    const m = new Map<string, string>();
    for (const o of allOrders) {
      if (o.paymentPhone) {
        if (o.userEmail) m.set(o.userEmail, o.paymentPhone);
        if (o.userName) m.set(o.userName, o.paymentPhone);
      }
    }
    return m;
  }, [allOrders]);

  const norm = (s: string) => s.toLowerCase().trim();
  const orders = allOrders.filter((o) => {
    if (orderStatus !== "all" && o.status !== orderStatus) return false;
    const q = norm(orderSearch);
    return !q || [o.userName, o.userEmail, o.courseTitle, o.paymentPhone].some((f) => f && norm(String(f)).includes(q));
  });
  const users = allUsers.filter((u) => {
    const q = norm(userSearch);
    return !q || [u.name, u.email].some((f) => norm(f).includes(q));
  });
  const courses = allCourses.filter((c) => {
    if (courseStatus !== "all" && (c.status ?? "published") !== courseStatus) return false;
    const q = norm(courseSearch);
    return !q || [c.title, c.category, c.instructor?.name].some((f) => f && norm(String(f)).includes(q));
  });
  const enrollments = allEnrollments.filter((e) => {
    const q = norm(enrollSearch);
    const phone = phoneByUser.get(e.userEmail) || phoneByUser.get(e.userName) || "";
    return !q || [e.userName, e.userEmail, e.courseTitle, phone].some((f) => f && norm(String(f)).includes(q));
  });
  const messages = allMessages.filter((m) => {
    const q = norm(msgSearch);
    return !q || [m.firstName, m.lastName, m.email, m.subject, m.message].some((f) => f && norm(String(f)).includes(q));
  });

  const students = allUsers.filter((u) => u.role === "student").filter((u) => {
    const q = norm(studentSearch);
    const phone = phoneByUser.get(u.email) || phoneByUser.get(u.name) || "";
    return !q || [u.name, u.email, phone].some((f) => f && norm(String(f)).includes(q));
  });
  const courseCountByInstructor = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of allCourses) {
      const n = c.instructor?.name;
      if (n) m.set(n, (m.get(n) ?? 0) + 1);
    }
    return m;
  }, [allCourses]);
  const instructors = allUsers.filter((u) => u.role === "instructor").filter((u) => {
    const q = norm(instructorSearch);
    const phone = phoneByUser.get(u.email) || phoneByUser.get(u.name) || "";
    return !q || [u.name, u.email, phone].some((f) => f && norm(String(f)).includes(q));
  });

  // Finance (revenue from approved orders, expenses from local records).
  const approvedOrders = allOrders.filter((o) => o.status === "approved");
  const totalRevenue = approvedOrders.reduce((s, o) => s + Number(o.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  const revenueByPeriod = useMemo(() => {
    const m = new Map<string, number>();
    for (const o of approvedOrders) {
      const key = periodKey(o.paidAt || o.createdAt, financeMode);
      m.set(key, (m.get(key) ?? 0) + Number(o.amount || 0));
    }
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordersData, financeMode]);

  const saveExpenses = (next: Expense[]) => {
    setExpenses(next);
    try { localStorage.setItem(EXPENSES_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const bulkApproveMut = useMutation({
    mutationFn: async () => {
      const targets = allOrders.filter((o) => o.status === "paid" || o.status === "pending_payment");
      for (const o of targets) await approveOrder(o.id);
      return targets.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success(`Approved ${count} order${count === 1 ? "" : "s"}`);
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Bulk approve failed"),
  });

  const pendingOrders = allOrders.filter((o) => o.status !== "approved").length;
  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: Receipt, badge: pendingOrders || undefined },
    { id: "students", label: "Students", icon: GraduationCap, badge: students.length || undefined },
    { id: "instructors", label: "Instructors", icon: UserCheck, badge: instructors.length || undefined },
    { id: "users", label: "Users", icon: Users, badge: stats?.users },
    { id: "courses", label: "Courses", icon: BookOpen, badge: stats?.courses },
    { id: "finance", label: "Finance", icon: Wallet },
    { id: "enrollments", label: "Enrollments", icon: GraduationCap, badge: stats?.enrollments },
    { id: "messages", label: "Messages", icon: MessageSquare, badge: stats?.messages },
    { id: "cms", label: "Site CMS", icon: Settings },
    { id: "profile", label: "Profile", icon: UserCircle },
  ];

  return (
    <DashboardLayout
      panelTitle="Admin Panel"
      panelSubtitle="Platform management"
      navItems={navItems}
      activeId={section}
      onNavigate={(id) => setSection(id as AdminSection)}
      user={user}
      onLogout={handleLogout}
    >
      {section === "overview" && (
        <DashboardSection title="Platform Overview" description="Quick stats and shortcuts to manage Hankaal College.">
          <StatGrid
            items={[
              { icon: Users, label: "Users", value: stats?.users ?? 0 },
              { icon: BookOpen, label: "Courses", value: stats?.courses ?? 0 },
              { icon: GraduationCap, label: "Enrollments", value: stats?.enrollments ?? 0 },
              { icon: MessageSquare, label: "Messages", value: stats?.messages ?? 0 },
              { icon: Mail, label: "Paid Orders", value: stats?.paidOrders ?? 0, accent: "var(--gradient-accent)" },
            ]}
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {[
              { id: "orders" as const, title: "Review Orders", desc: "Approve payments and unlock courses", count: pendingOrders },
              { id: "courses" as const, title: "Manage Courses", desc: "Publish, edit, or delete courses", count: coursesData?.courses?.filter((c) => c.status === "pending").length ?? 0 },
              { id: "messages" as const, title: "Contact Messages", desc: "Website contact form inbox", count: messagesData?.messages?.length ?? 0 },
            ].map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => setSection(card.id)}
                className="text-left p-5 rounded-2xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{card.title}</span>
                  {card.count > 0 && <Badge variant="secondary">{card.count}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{card.desc}</p>
              </button>
            ))}
          </div>
        </DashboardSection>
      )}

      {section === "orders" && (
        <DashboardSection
          title="Payment Orders"
          description="Student payment orders — read messages below each order, then approve to unlock course access."
        >
          <div className="flex flex-wrap gap-3 items-center">
            <SearchBar value={orderSearch} onChange={setOrderSearch} placeholder="Search name, email, phone, course..." />
            <Select value={orderStatus} onValueChange={setOrderStatus}>
              <SelectTrigger className="w-40 h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="pending_payment">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="hero"
              disabled={bulkApproveMut.isPending || pendingOrders === 0}
              onClick={() => {
                if (window.confirm(`Approve ALL ${pendingOrders} pending/paid order(s) and unlock their courses?`)) {
                  bulkApproveMut.mutate();
                }
              }}
            >
              <CheckCheck className="h-4 w-4" /> {bulkApproveMut.isPending ? "Approving..." : "Approve All"}
            </Button>
          </div>
          {orders.length === 0 ? (
            <ContentCard><p className="text-center text-muted-foreground py-8">No matching orders.</p></ContentCard>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <AdminOrderCard
                  key={o.id}
                  order={o}
                  onDelete={() => {
                    if (window.confirm("Delete this order permanently? This does not remove course access.")) {
                      deleteOrderMut.mutate(o.id);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </DashboardSection>
      )}

      {section === "users" && (
        <DashboardSection title="User Management" description="Create accounts, change roles, or remove users.">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <SearchBar value={userSearch} onChange={setUserSearch} placeholder="Search users by name or email..." />
            <Button variant="hero" onClick={() => setShowCreateUser(!showCreateUser)}>
              <Plus className="h-4 w-4" /> {showCreateUser ? "Hide Form" : "Create User"}
            </Button>
          </div>

          {showCreateUser && (
            <ContentCard>
              <h3 className="font-bold mb-4">New User Account</h3>
              <form
                className="grid sm:grid-cols-2 gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = new FormData(e.currentTarget);
                  createUserMut.mutate({
                    name: form.get("name") as string,
                    email: form.get("email") as string,
                    password: form.get("password") as string,
                    role: newUserRole,
                  });
                  e.currentTarget.reset();
                  setNewUserRole("student");
                }}
              >
                <div className="space-y-2">
                  <Label htmlFor="new-name">Full name</Label>
                  <Input id="new-name" name="name" required placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-email">Email</Label>
                  <Input id="new-email" name="email" type="email" required placeholder="Enter email address" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">Password</Label>
                  <Input id="new-password" name="password" type="password" required minLength={6} placeholder="Min. 6 characters" />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as typeof newUserRole)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="instructor">Instructor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2 flex gap-2">
                  <Button type="submit" variant="hero" disabled={createUserMut.isPending}>
                    {createUserMut.isPending ? "Creating..." : "Create Account"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreateUser(false)}>Cancel</Button>
                </div>
              </form>
            </ContentCard>
          )}

          <ContentCard noPadding className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Select value={u.role} onValueChange={(role) => updateRoleMut.mutate({ id: u.id, role })}>
                          <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">student</SelectItem>
                            <SelectItem value="instructor">instructor</SelectItem>
                            <SelectItem value="admin">admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(u.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={u.email === user?.email}
                          onClick={() => {
                            if (window.confirm(`Delete user "${u.name}" (${u.email})? This cannot be undone.`)) {
                              deleteUserMut.mutate(u.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          </ContentCard>
        </DashboardSection>
      )}

      {section === "courses" && (
        <DashboardSection title="Course Management" description="Create, publish, edit, and delete platform courses.">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
              <div className="flex flex-wrap gap-3 items-center">
                <SearchBar value={courseSearch} onChange={setCourseSearch} placeholder="Search courses by name..." />
                <Select value={courseStatus} onValueChange={setCourseStatus}>
                  <SelectTrigger className="w-40 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="hero" onClick={() => setShowCourseForm(!showCourseForm)}>
                <Plus className="h-4 w-4" /> {showCourseForm ? "Hide Form" : "Create Complete Course"}
              </Button>
            </div>

            {showCourseForm && !editingCourse && (
              <CourseForm
                submitLabel="Publish Course"
                loading={createCourseMut.isPending}
                onCancel={() => setShowCourseForm(false)}
                onSubmit={(data) => createCourseMut.mutate(data)}
              />
            )}

            {editingCourse && (
              <div className="mb-6">
                <h3 className="font-bold mb-4">Editing: {editingCourse.title}</h3>
                <CourseForm
                  key={editingCourse.id}
                  initialValues={courseToFormValues(editingCourse)}
                  submitLabel="Save Changes"
                  loading={updateCourseMut.isPending}
                  onCancel={() => setEditingCourse(null)}
                  onSubmit={(data) => updateCourseMut.mutate({ id: editingCourse.id, data })}
                />
              </div>
            )}

            <ContentCard noPadding className="overflow-hidden mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell><Badge variant={c.status === "published" ? "default" : "secondary"}>{c.status ?? "published"}</Badge></TableCell>
                      <TableCell>${c.price}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="hero" asChild>
                            <Link to="/learn/$courseId" params={{ courseId: c.slug }}>
                              <PlayCircle className="h-3 w-3 mr-1" /> Open Course
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" title="Edit course" onClick={() => { setShowCourseForm(false); setEditingCourse(c); }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          {c.status === "pending" && (
                            <Button size="sm" variant="hero" onClick={() => courseStatusMut.mutate({ id: c.id, status: "published" })}>Approve</Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete course"
                            onClick={() => {
                              if (window.confirm(`Delete "${c.title}"? This removes the course even if students are enrolled.`)) {
                                deleteCourseMut.mutate(c.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ContentCard>
        </DashboardSection>
      )}

      {section === "cms" && (
        <DashboardSection title="Site CMS" description="Settings, student stories, and team members.">
            <div className="space-y-8">
              <ContentCard>
                <h3 className="font-bold mb-4">Site Settings</h3>
                <form
                  className="grid sm:grid-cols-2 gap-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    const settings = Object.fromEntries(form.entries()) as Record<string, string>;
                    await updateAdminSettings(settings);
                    toast.success("Settings saved");
                    queryClient.invalidateQueries({ queryKey: ["site-settings"] });
                  }}
                >
                  {["logo_url", "hero_image_url", "about_video_url", "whatsapp_url", "payment_ussd_prefix", "payment_ussd_suffix", "site_name", "site_tagline", "contact_email", "contact_phone", "facebook_url"].map((key) => (
                    <div key={key} className={key === "hero_image_url" || key === "about_video_url" ? "sm:col-span-2 space-y-1" : "space-y-1"}>
                      <Label>{key === "hero_image_url" ? "cover image url" : key.replace(/_/g, " ")}</Label>
                      <Input
                        name={key}
                        defaultValue={settingsData?.settings?.[key] ?? ""}
                        placeholder={
                          key === "hero_image_url"
                            ? "Paste cover image link (URL) for the homepage"
                            : key === "about_video_url"
                              ? "Paste video link (YouTube or .mp4) for the About page"
                              : key === "logo_url"
                                ? "/hankaal-logo.png or full image URL"
                                : undefined
                        }
                      />
                      {key === "hero_image_url" && settingsData?.settings?.hero_image_url && (
                        <img
                          src={settingsData.settings.hero_image_url}
                          alt="Hero preview"
                          className="mt-2 h-24 w-full max-w-xs rounded-lg object-cover border border-border"
                        />
                      )}
                    </div>
                  ))}
                  <div className="sm:col-span-2"><Button type="submit" variant="hero">Save Settings</Button></div>
                </form>
              </ContentCard>

              <div>
                <h3 className="font-bold mb-4">Student Testimonials</h3>
                <div className="space-y-3">
                  {(testimonialsData?.testimonials ?? []).map((t) => (
                    <form
                      key={t.id}
                      className="p-4 rounded-xl border border-border grid sm:grid-cols-2 gap-3"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const form = new FormData(e.currentTarget);
                        await saveTestimonial(t.id ?? null, {
                          name: form.get("name") as string,
                          role: form.get("role") as string,
                          avatar: form.get("avatar") as string,
                          quote: form.get("quote") as string,
                        });
                        toast.success("Updated");
                        queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
                        queryClient.invalidateQueries({ queryKey: ["testimonials"] });
                      }}
                    >
                      <Input name="name" defaultValue={t.name} placeholder="Name" />
                      <Input name="role" defaultValue={t.role} placeholder="Role" />
                      <Input name="avatar" defaultValue={t.avatar} placeholder="Image URL" className="sm:col-span-2" />
                      <Textarea name="quote" defaultValue={t.quote} className="sm:col-span-2" rows={2} />
                      <div className="flex gap-2 sm:col-span-2">
                        <Button type="submit" size="sm" variant="hero">Save</Button>
                        {t.id && (
                          <Button type="button" size="sm" variant="outline" onClick={async () => {
                            await deleteTestimonial(t.id!);
                            queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
                          }}>Delete</Button>
                        )}
                      </div>
                    </form>
                  ))}
                  <Button variant="outline" size="sm" onClick={async () => {
                    await saveTestimonial(null, { name: "New Student", role: "Role", avatar: "https://i.pravatar.cc/150", quote: "Great experience!" });
                    queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
                  }}><Plus className="h-4 w-4" /> Add Story</Button>
                </div>
              </div>

              <div>
                <h3 className="font-bold mb-4">Our Team</h3>
                <div className="space-y-3">
                  {(teamData?.team ?? []).map((m) => (
                    <form
                      key={m.id}
                      className="p-4 rounded-xl border border-border grid sm:grid-cols-3 gap-3"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const form = new FormData(e.currentTarget);
                        await saveTeamMember(m.id ?? null, {
                          name: form.get("name") as string,
                          role: form.get("role") as string,
                          avatar: form.get("avatar") as string,
                        });
                        toast.success("Updated");
                        queryClient.invalidateQueries({ queryKey: ["admin-team"] });
                        queryClient.invalidateQueries({ queryKey: ["team"] });
                      }}
                    >
                      <Input name="name" defaultValue={m.name} placeholder="Name" />
                      <Input name="role" defaultValue={m.role} placeholder="Role" />
                      <Input name="avatar" defaultValue={m.avatar} placeholder="Image URL" />
                      <div className="flex gap-2 sm:col-span-3">
                        <Button type="submit" size="sm" variant="hero">Save</Button>
                        {m.id && (
                          <Button type="button" size="sm" variant="outline" onClick={async () => {
                            await deleteTeamMember(m.id!);
                            queryClient.invalidateQueries({ queryKey: ["admin-team"] });
                          }}>Delete</Button>
                        )}
                      </div>
                    </form>
                  ))}
                  <Button variant="outline" size="sm" onClick={async () => {
                    await saveTeamMember(null, { name: "New Member", role: "Role", avatar: "https://i.pravatar.cc/300" });
                    queryClient.invalidateQueries({ queryKey: ["admin-team"] });
                  }}><Plus className="h-4 w-4" /> Add Member</Button>
                </div>
              </div>
            </div>
        </DashboardSection>
      )}

      {section === "enrollments" && (
        <DashboardSection title="Enrollments" description="All student course enrollments and progress.">
          <SearchBar value={enrollSearch} onChange={setEnrollSearch} placeholder="Search by name, email, phone, or course..." />
          <ContentCard noPadding className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <div className="font-medium">{e.userName}</div>
                        <div className="text-xs text-muted-foreground">{e.userEmail}</div>
                      </TableCell>
                      <TableCell>{e.courseTitle}</TableCell>
                      <TableCell>{e.progress}%</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(e.enrolledAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          title="Remove enrollment"
                          onClick={() => {
                            if (window.confirm(`Remove ${e.userName}'s access to "${e.courseTitle}"?`)) {
                              deleteEnrollmentMut.mutate(e.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          </ContentCard>
        </DashboardSection>
      )}

      {section === "messages" && (
        <DashboardSection
          title="Contact Messages"
          description="Contact form messages from the website. For course payment chat, use Orders."
        >
            <SearchBar value={msgSearch} onChange={setMsgSearch} placeholder="Search messages by name, email, or text..." />
            <div className="space-y-4">
              {messages.length === 0 ? (
                <p className="text-muted-foreground text-center py-12">No matching messages.</p>
              ) : (
                messages.map((m) => (
                  <ContentCard key={m.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="font-semibold">{m.firstName} {m.lastName}</div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground">{formatDateTime(m.createdAt)}</div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          title="Delete message"
                          onClick={() => {
                            if (window.confirm("Delete this message?")) deleteMessageMut.mutate(m.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">{m.email}</div>
                    <div className="font-medium mt-2">{m.subject}</div>
                    <p className="text-sm text-muted-foreground mt-1">{m.message}</p>
                  </ContentCard>
                ))
              )}
            </div>
        </DashboardSection>
      )}

      {section === "students" && (
        <DashboardSection title={`Students (${students.length})`} description="All student accounts — search by name or phone number.">
          <SearchBar value={studentSearch} onChange={setStudentSearch} placeholder="Search students by name or number..." />
          <ContentCard noPadding className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{phoneByUser.get(u.email) || phoneByUser.get(u.name) || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(u.createdAt)}</TableCell>
                  </TableRow>
                ))}
                {students.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No students found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </ContentCard>
        </DashboardSection>
      )}

      {section === "instructors" && (
        <DashboardSection title={`Instructors (${instructors.length})`} description="All instructor accounts and how many courses each created.">
          <SearchBar value={instructorSearch} onChange={setInstructorSearch} placeholder="Search instructors by name or number..." />
          <ContentCard noPadding className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Courses</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {instructors.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{phoneByUser.get(u.email) || phoneByUser.get(u.name) || "—"}</TableCell>
                    <TableCell><Badge variant="secondary">{courseCountByInstructor.get(u.name) ?? 0}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(u.createdAt)}</TableCell>
                  </TableRow>
                ))}
                {instructors.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No instructors found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </ContentCard>
        </DashboardSection>
      )}

      {section === "finance" && (
        <DashboardSection title="Finance & Revenue" description="Revenue from approved orders, expenses, and net profit.">
          <StatGrid
            items={[
              { icon: DollarSign, label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}` },
              { icon: Wallet, label: "Total Expenses", value: `$${totalExpenses.toFixed(2)}` },
              { icon: TrendingUp, label: "Net Profit", value: `$${netProfit.toFixed(2)}`, accent: "var(--gradient-accent)" },
              { icon: Receipt, label: "Approved Orders", value: approvedOrders.length },
            ]}
          />

          <ContentCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Revenue Report</h3>
              <Select value={financeMode} onValueChange={(v) => setFinanceMode(v as "week" | "month" | "year")}>
                <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Weekly</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {revenueByPeriod.length === 0 ? (
              <p className="text-sm text-muted-foreground">No approved revenue yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Period</TableHead><TableHead className="text-right">Revenue</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {revenueByPeriod.map(([period, amount]) => (
                    <TableRow key={period}>
                      <TableCell className="font-medium">{period}</TableCell>
                      <TableCell className="text-right">${amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ContentCard>

          <ContentCard>
            <h3 className="font-bold mb-1">Expenses</h3>
            <p className="text-xs text-muted-foreground mb-4">Record expenses to compute net profit. (Saved on this device.)</p>
            <form
              className="flex flex-wrap gap-2 mb-4"
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                const label = String(form.get("label") || "").trim();
                const amount = Number(form.get("amount"));
                if (!label || !amount) return;
                saveExpenses([{ id: `${Date.now()}-${expenses.length}`, label, amount, date: new Date().toISOString() }, ...expenses]);
                e.currentTarget.reset();
              }}
            >
              <Input name="label" placeholder="Expense (e.g. Hosting)" className="flex-1 min-w-[160px]" />
              <Input name="amount" type="number" min={0} step="0.01" placeholder="Amount $" className="w-32" />
              <Button type="submit" variant="hero"><Plus className="h-4 w-4" /> Add</Button>
            </form>
            {expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses recorded.</p>
            ) : (
              <div className="space-y-2">
                {expenses.map((ex) => (
                  <div key={ex.id} className="flex items-center justify-between text-sm rounded-lg border border-border px-3 py-2">
                    <div><span className="font-medium">{ex.label}</span> <span className="text-muted-foreground">· {formatDate(ex.date)}</span></div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">${ex.amount.toFixed(2)}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => saveExpenses(expenses.filter((x) => x.id !== ex.id))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ContentCard>
        </DashboardSection>
      )}

      {section === "profile" && (
        <DashboardSection title="My Profile" description="Your admin account uses the Hankaal logo by default. Update your name or photo.">
          <ProfileEditor />
        </DashboardSection>
      )}
    </DashboardLayout>
  );
}

function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative flex-1 min-w-[220px] max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Search..."}
        className="pl-9 h-10"
      />
    </div>
  );
}
