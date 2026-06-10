import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Award, BookOpen, GraduationCap, PlayCircle, TrendingUp, Receipt, ShoppingCart, CheckCircle2, LayoutDashboard, Compass,
} from "lucide-react";
import { fetchMyOrders } from "@/lib/api/orders";
import { StudentOrderCard } from "@/components/site/StudentOrderCard";
import { DashboardLayout, DashboardSection, StatGrid, ContentCard } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { fetchEnrollments, fetchEnrollmentStats } from "@/lib/api/enrollments";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !localStorage.getItem("hankaal_token")) {
      throw redirect({ to: "/login" });
    }
  },
  head: () => ({
    meta: [
      { title: "My Dashboard — Hankaal College" },
      { name: "description", content: "Track your enrolled courses and learning progress." },
    ],
  }),
  component: DashboardPage,
});

type StudentSection = "overview" | "courses" | "orders";

function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState<StudentSection>("overview");

  useEffect(() => {
    if (!authLoading && user?.role === "admin") navigate({ to: "/admin" });
    if (!authLoading && user?.role === "instructor") navigate({ to: "/instructor" });
  }, [user, authLoading, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["enrollments"],
    queryFn: fetchEnrollments,
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ["enrollment-stats"],
    queryFn: fetchEnrollmentStats,
    enabled: !!user,
  });

  const { data: ordersData } = useQuery({
    queryKey: ["my-orders"],
    queryFn: fetchMyOrders,
    enabled: !!user && user.role === "student",
    refetchInterval: 15000,
  });

  const enrollments = data?.enrollments ?? [];
  const orders = ordersData?.orders ?? [];
  const pendingOrders = orders.filter((o) => o.status !== "approved");

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "courses", label: "My Courses", icon: GraduationCap, badge: enrollments.length || undefined },
    { id: "orders", label: "Orders & Payment", icon: Receipt, badge: pendingOrders.length || undefined },
  ];

  return (
    <DashboardLayout
      panelTitle="Student Dashboard"
      panelSubtitle={`Welcome${user ? `, ${user.name.split(" ")[0]}` : ""}`}
      navItems={navItems}
      activeId={section}
      onNavigate={(id) => setSection(id as StudentSection)}
      user={user}
      onLogout={handleLogout}
      headerActions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/cart"><ShoppingCart className="h-4 w-4" /> Cart</Link>
          </Button>
          <Button variant="hero" size="sm" asChild>
            <Link to="/courses"><Compass className="h-4 w-4" /> Browse</Link>
          </Button>
        </div>
      }
    >
      {section === "overview" && (
        <DashboardSection title="Learning Overview" description="Your progress, orders, and how to get started.">
          <div
            className="rounded-2xl p-6 md:p-8 text-primary-foreground"
            style={{ background: "var(--gradient-hero)" }}
          >
            <h2 className="text-2xl font-display font-bold">
              Welcome back{user ? `, ${user.name.split(" ")[0]}` : ""}
            </h2>
            <p className="mt-2 opacity-90 text-sm md:text-base max-w-xl">
              Browse courses, enroll free or pay for paid courses, then learn at your pace.
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              <Button variant="accent" asChild>
                <Link to="/courses">Browse Courses</Link>
              </Button>
              <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" asChild>
                <Link to="/cart"><ShoppingCart className="h-4 w-4" /> Cart</Link>
              </Button>
            </div>
          </div>

          <StatGrid
            items={[
              { icon: BookOpen, label: "Enrolled Courses", value: stats?.totalEnrolled ?? 0 },
              { icon: TrendingUp, label: "Avg. Progress", value: `${stats?.avgProgress ?? 0}%` },
              { icon: Award, label: "Completed", value: stats?.completed ?? 0, accent: "var(--gradient-accent)" },
            ]}
          />

          <ContentCard>
            <h3 className="font-display font-bold mb-4">How it works</h3>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex gap-3 p-4 rounded-xl bg-muted/40">
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                <div>
                  <strong>Free courses</strong>
                  <p className="text-muted-foreground mt-1">View Course → Enroll Free → watch lessons & quizzes immediately.</p>
                </div>
              </div>
              <div className="flex gap-3 p-4 rounded-xl bg-muted/40">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <strong>Paid courses</strong>
                  <p className="text-muted-foreground mt-1">
                    Add to Cart → pay via USSD *712*614554731*amount# → message admin → start after approval.
                  </p>
                </div>
              </div>
            </div>
          </ContentCard>

          {pendingOrders.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold">Pending Orders</h3>
                <Button variant="link" size="sm" onClick={() => setSection("orders")}>View all</Button>
              </div>
              <div className="space-y-4">
                {pendingOrders.slice(0, 2).map((o) => (
                  <StudentOrderCard key={o.id} order={o} />
                ))}
              </div>
            </div>
          )}
        </DashboardSection>
      )}

      {section === "orders" && (
        <DashboardSection
          title="Orders & Payment"
          description="Track USSD payments and chat with admin until your courses are approved."
        >
          {orders.length === 0 ? (
            <ContentCard>
              <div className="text-center py-10">
                <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">No orders yet</p>
                <p className="text-sm text-muted-foreground mt-1">Paid courses will appear here after checkout.</p>
                <Button variant="hero" className="mt-4" asChild>
                  <Link to="/courses">Browse Courses</Link>
                </Button>
              </div>
            </ContentCard>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <StudentOrderCard key={o.id} order={o} />
              ))}
            </div>
          )}
        </DashboardSection>
      )}

      {section === "courses" && (
        <DashboardSection title="My Courses" description="Continue learning from where you left off.">
          {authLoading || isLoading ? (
            <div className="grid gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : enrollments.length === 0 ? (
            <ContentCard>
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium text-lg">No enrolled courses yet</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                  Find a course — free ones enroll instantly; paid ones go through cart and admin approval.
                </p>
                <Button variant="hero" className="mt-6" asChild>
                  <Link to="/courses">Find a Course</Link>
                </Button>
              </div>
            </ContentCard>
          ) : (
            <div className="grid gap-4">
              {enrollments.map((e) => (
                <ContentCard key={e.id} className="flex flex-col sm:flex-row gap-5 !p-5 md:!p-6">
                  <div
                    className="sm:w-44 h-28 rounded-xl shrink-0 grid place-items-center text-white font-display font-bold text-sm text-center px-3"
                    style={{ background: e.course.thumbnail }}
                  >
                    {e.course.category}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">{e.course.level}</Badge>
                      {e.progress >= 100 && <Badge className="bg-accent text-accent-foreground border-0 text-xs">Completed</Badge>}
                    </div>
                    <h3 className="font-display font-bold text-lg">{e.course.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">by {e.course.instructor.name}</p>
                    <div className="mt-4 flex items-center gap-3">
                      <Progress value={e.progress} className="flex-1 h-2.5" />
                      <span className="text-sm font-medium text-muted-foreground w-12">{e.progress}%</span>
                    </div>
                  </div>
                  <Button variant="hero" className="shrink-0 self-center" asChild>
                    <Link to="/learn/$courseId" params={{ courseId: e.course.slug }}>
                      <PlayCircle className="h-4 w-4" /> Continue
                    </Link>
                  </Button>
                </ContentCard>
              ))}
            </div>
          )}
        </DashboardSection>
      )}
    </DashboardLayout>
  );
}
