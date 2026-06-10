import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RoleAccessLogin } from "@/components/auth/RoleAccessLogin";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  BookOpen, Mail, Trash2, Users, GraduationCap, MessageSquare, Plus, LayoutDashboard, Pencil, PlayCircle, Settings, Receipt,
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
} from "@/lib/api/admin";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/client";
import { CourseForm } from "@/components/courses/CourseForm";
import { createAdminCourse, updateAdminCourse, courseToFormValues } from "@/lib/api/instructor";
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

type AdminSection = "overview" | "orders" | "users" | "courses" | "enrollments" | "messages" | "cms";

function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [section, setSection] = useState<AdminSection>("overview");
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserRole, setNewUserRole] = useState<"student" | "instructor" | "admin">("student");
  const [editingCourse, setEditingCourse] = useState<(Course & { status?: string }) | null>(null);

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

  const pendingOrders = (ordersData?.orders ?? []).filter((o) => o.status !== "approved").length;
  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "orders", label: "Orders", icon: Receipt, badge: pendingOrders || undefined },
    { id: "users", label: "Users", icon: Users, badge: stats?.users },
    { id: "courses", label: "Courses", icon: BookOpen, badge: stats?.courses },
    { id: "enrollments", label: "Enrollments", icon: GraduationCap, badge: stats?.enrollments },
    { id: "messages", label: "Messages", icon: MessageSquare, badge: stats?.messages },
    { id: "cms", label: "Site CMS", icon: Settings },
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
          {(ordersData?.orders ?? []).length === 0 ? (
            <ContentCard><p className="text-center text-muted-foreground py-8">No orders yet.</p></ContentCard>
          ) : (
            <div className="space-y-4">
              {(ordersData?.orders ?? []).map((o) => (
                <AdminOrderCard key={o.id} order={o} />
              ))}
            </div>
          )}
        </DashboardSection>
      )}

      {section === "users" && (
        <DashboardSection title="User Management" description="Create accounts, change roles, or remove users.">
          <div className="flex justify-end">
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
                  {(usersData?.users ?? []).map((u) => (
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
                        {new Date(u.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => deleteUserMut.mutate(u.id)} disabled={u.email === user?.email}>
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
            <div className="flex justify-end mb-4">
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
                  {(coursesData?.courses ?? []).map((c) => (
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
                  {["logo_url", "whatsapp_url", "payment_ussd_prefix", "payment_ussd_suffix", "site_name", "site_tagline"].map((key) => (
                    <div key={key} className="space-y-1">
                      <Label>{key.replace(/_/g, " ")}</Label>
                      <Input name={key} defaultValue={settingsData?.settings?.[key] ?? ""} />
                    </div>
                  ))}
                  <div className="sm:col-span-2"><Button type="submit" variant="hero">Save Settings</Button></div>
                </form>
              </ContentCard>

              <div>
                <h3 className="font-bold mb-4">Student Stories</h3>
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
          <ContentCard noPadding className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Enrolled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(enrollmentsData?.enrollments ?? []).map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <div className="font-medium">{e.userName}</div>
                        <div className="text-xs text-muted-foreground">{e.userEmail}</div>
                      </TableCell>
                      <TableCell>{e.courseTitle}</TableCell>
                      <TableCell>{e.progress}%</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(e.enrolledAt).toLocaleDateString()}
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
            <div className="space-y-4">
              {(messagesData?.messages ?? []).length === 0 ? (
                <p className="text-muted-foreground text-center py-12">No messages yet.</p>
              ) : (
                (messagesData?.messages ?? []).map((m) => (
                  <ContentCard key={m.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="font-semibold">{m.firstName} {m.lastName}</div>
                      <div className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleString()}</div>
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
    </DashboardLayout>
  );
}
