import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Logo } from "@/components/site/Logo";
import { AUTH_IMAGE } from "@/lib/images";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api/client";
import { useState } from "react";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Sign up — Hankaal College" },
      { name: "description", content: "Create your free Hankaal College account and start learning today." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = form.get("name") as string;
    const email = form.get("email") as string;
    const password = form.get("password") as string;
    const confirm = form.get("confirm") as string;

    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const newUser = await register(name, email, password);
      toast.success("Account created — welcome to Hankaal!");
      if (newUser.role === "admin") navigate({ to: "/admin" });
      else if (newUser.role === "instructor") navigate({ to: "/instructor" });
      else navigate({ to: "/dashboard" });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Registration failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex items-center justify-center relative p-12" style={{ background: "var(--gradient-hero)" }}>
        <div className="max-w-md text-primary-foreground">
          <Logo size={88} />
          <h2 className="text-4xl font-display font-extrabold mt-12 leading-tight">Start learning. Start growing.</h2>
          <p className="mt-4 opacity-90">Join 50,000+ students from 120+ countries on a path to real skills and real outcomes.</p>
          <ul className="mt-8 space-y-3">
            {["Free account, no card required", "Access to all free courses instantly", "Verified certificates on completion", "Cancel any paid plan anytime"].map((x) => (
              <li key={x} className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-accent" /> {x}</li>
            ))}
          </ul>
          <img src={AUTH_IMAGE} alt="" width={1024} height={1024} loading="lazy" className="rounded-2xl mt-10 shadow-2xl" />
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8"><Logo size={72} /></div>
          <h1 className="text-3xl font-display font-extrabold">Create your account</h1>
          <p className="text-muted-foreground mt-2">It's free and only takes a minute.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2"><Label htmlFor="name">Full name</Label><Input id="name" name="name" required /></div>
            <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
            <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" minLength={6} required /></div>
            <div className="space-y-2"><Label htmlFor="confirm">Confirm password</Label><Input id="confirm" name="confirm" type="password" required /></div>
            <label className="flex items-start gap-2 text-sm text-muted-foreground"><Checkbox className="mt-0.5" required /> I agree to the <a href="#" className="text-primary hover:underline">Terms</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a></label>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Already a member? <Link to="/login" className="text-primary font-semibold hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
