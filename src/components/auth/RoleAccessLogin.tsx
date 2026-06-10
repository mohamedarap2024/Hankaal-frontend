import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Shield, GraduationCap, BookOpen } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/site/Logo";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api/client";
import { toast } from "sonner";

type Role = "admin" | "instructor";

const config: Record<
  Role,
  {
    title: string;
    subtitle: string;
    icon: typeof Shield;
    allowedRoles: string[];
    demoEmail: string;
    demoPassword: string;
    studentLink: string;
  }
> = {
  admin: {
    title: "Admin Access Login",
    subtitle: "Authorized administrators only. Manage users, courses, orders, and platform settings.",
    icon: Shield,
    allowedRoles: ["admin"],
    demoEmail: "admin@hankaal.edu",
    demoPassword: "admin123",
    studentLink: "/login",
  },
  instructor: {
    title: "Instructor Access Login",
    subtitle: "Authorized instructors only. Create, edit, and manage your courses.",
    icon: GraduationCap,
    allowedRoles: ["instructor"],
    demoEmail: "instructor@hankaal.edu",
    demoPassword: "instructor123",
    studentLink: "/login",
  },
};

type RoleAccessLoginProps = {
  role: Role;
  accessDenied?: boolean;
};

export function RoleAccessLogin({ role, accessDenied }: RoleAccessLoginProps) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const cfg = config[role];
  const Icon = cfg.icon;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    setLoading(true);
    try {
      const loggedIn = await login(email, password);
      if (!cfg.allowedRoles.includes(loggedIn.role)) {
        logout();
        toast.error(`Access denied. This portal is for ${role === "admin" ? "admins" : "instructors"} only.`);
        return;
      }
      toast.success(`Welcome, ${loggedIn.name}!`);
      navigate({ to: role === "admin" ? "/admin" : "/instructor", replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex items-center justify-center relative p-12" style={{ background: "var(--gradient-hero)" }}>
        <div className="max-w-md text-white">
          <Logo size={88} withText />
          <div className="mt-12 flex items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-white/15 grid place-items-center">
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-3xl font-display font-extrabold leading-tight">{cfg.title}</h2>
              <p className="text-sm opacity-90 mt-1">Hankaal College Staff Portal</p>
            </div>
          </div>
          <p className="mt-6 opacity-90 leading-relaxed">{cfg.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <Logo size={64} withText />
          </div>

          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <div className="h-12 w-12 rounded-xl grid place-items-center text-white" style={{ background: "var(--gradient-hero)" }}>
              <Icon className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-display font-extrabold">{cfg.title}</h1>
          </div>

          <h1 className="hidden lg:block text-3xl font-display font-extrabold">{cfg.title}</h1>
          <p className="text-muted-foreground mt-2">{cfg.subtitle}</p>

          {accessDenied && (
            <div className="mt-4 p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-sm text-destructive">
              Your account does not have {role} access. Please sign in with an authorized account.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{role === "admin" ? "Admin Email" : "Instructor Email"}</Label>
              <Input id="email" name="email" type="email" placeholder={cfg.demoEmail} required autoComplete="username" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={show ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : role === "admin" ? "Sign in to Admin Panel" : "Sign in to Instructor Panel"}
            </Button>
          </form>

          <div className="mt-6 p-4 rounded-xl bg-muted/50 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground text-sm mb-2">Demo {role} account</p>
            <p>{cfg.demoEmail} / {cfg.demoPassword}</p>
          </div>

          <div className="mt-8 flex flex-col gap-2 text-center text-sm text-muted-foreground">
            <Link to={cfg.studentLink} className="inline-flex items-center justify-center gap-1.5 text-primary font-semibold hover:underline">
              <BookOpen className="h-4 w-4" /> Student login
            </Link>
            <Link to="/" className="hover:underline">← Back to home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
