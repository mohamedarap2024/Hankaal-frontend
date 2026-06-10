import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/site/Logo";
import { AUTH_IMAGE } from "@/lib/images";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — Hankaal College" },
      { name: "description", content: "Welcome back to Hankaal College. Log in to continue learning." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    setLoading(true);
    try {
      const loggedIn = await login(email, password);
      if (loggedIn.role === "admin") {
        logout();
        toast.error("Admin accounts can only sign in at /admin");
        return;
      }
      if (loggedIn.role === "instructor") {
        logout();
        toast.error("Instructors must use the Be Instructor button on the home page.");
        return;
      }
      toast.success("Welcome back!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Login failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex items-center justify-center relative p-12" style={{ background: "var(--gradient-hero)" }}>
        <div className="max-w-md text-primary-foreground">
          <Logo size={88} withText />
          <h2 className="text-4xl font-display font-extrabold mt-12 leading-tight">Welcome back to your learning journey.</h2>
          <p className="mt-4 opacity-90">Pick up right where you left off. Your courses, certificates, and community are waiting.</p>
          <img src={AUTH_IMAGE} alt="" width={1024} height={1024} loading="lazy" className="rounded-2xl mt-10 shadow-2xl" />
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8"><Logo size={72} withText /></div>
          <h1 className="text-3xl font-display font-extrabold">Student Login</h1>
          <p className="text-muted-foreground mt-2">Welcome back — sign in to learn and track your courses.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" placeholder="Enter your email address" required autoComplete="username" /></div>
            <div className="space-y-2">
              <div className="flex items-center justify-between"><Label htmlFor="password">Password</Label>
                <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
              </div>
              <div className="relative">
                <Input id="password" name="password" type={show ? "text" : "password"} placeholder="Enter your password" required autoComplete="current-password" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground"><Checkbox /> Remember me for 30 days</label>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : "Log in"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Don't have an account? <Link to="/register" className="text-primary font-semibold hover:underline">Sign up free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

