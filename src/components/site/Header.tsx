import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, Menu, ShoppingCart, User, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { fetchCart } from "@/lib/api/cart";

const links = [
  { to: "/", label: "Home" },
  { to: "/courses", label: "Courses" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

function dashboardPath(role?: string) {
  if (role === "admin") return "/admin";
  if (role === "instructor") return "/instructor";
  return "/dashboard";
}

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: fetchCart,
    enabled: !!user && user.role === "student",
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate({ to: "/" });
    setOpen(false);
  };

  const dashLabel = user?.role === "admin" ? "Admin" : user?.role === "instructor" ? "Instructor" : "Dashboard";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all",
        scrolled ? "bg-background/80 backdrop-blur-md border-b border-border" : "bg-background/0 border-b border-transparent",
      )}
    >
      <div className="container mx-auto px-4 h-[4.25rem] flex items-center justify-between gap-4">
        <Logo size={42} withText className="min-w-0 mr-1" />
        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md"
              activeProps={{ className: "text-primary !font-semibold" }}
            >
              {l.label}
            </Link>
          ))}
          {user && (
            <Link
              to={dashboardPath(user.role)}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md"
              activeProps={{ className: "text-primary !font-semibold" }}
            >
              {dashLabel}
            </Link>
          )}
        </nav>
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          {user?.role === "student" && (
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link to="/cart">
                <ShoppingCart className="h-5 w-5" />
                {(cart?.items.length ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent text-[10px] font-bold text-accent-foreground grid place-items-center">
                    {cart!.items.length}
                  </span>
                )}
              </Link>
            </Button>
          )}
          {user ? (
            <>
              <span className="text-sm text-muted-foreground flex items-center gap-1.5 px-2">
                <User className="h-4 w-4" /> {user.name.split(" ")[0]}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-1" /> Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild><Link to="/login">Log in</Link></Button>
              <Button variant="hero" size="sm" asChild><Link to="/register">Get Started</Link></Button>
            </>
          )}
        </div>
        <div className="md:hidden flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="px-3 py-2 text-sm font-medium hover:bg-muted rounded-md">
                {l.label}
              </Link>
            ))}
            {user && (
              <Link to={dashboardPath(user.role)} onClick={() => setOpen(false)} className="px-3 py-2 text-sm font-medium hover:bg-muted rounded-md">
                {dashLabel}
              </Link>
            )}
            {user?.role === "student" && (
              <Link to="/cart" onClick={() => setOpen(false)} className="px-3 py-2 text-sm font-medium hover:bg-muted rounded-md">
                Cart ({cart?.items.length ?? 0})
              </Link>
            )}
            <div className="flex gap-2 pt-2">
              {user ? (
                <Button variant="outline" size="sm" className="flex-1" onClick={handleLogout}>Log out</Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" className="flex-1" asChild><Link to="/login" onClick={() => setOpen(false)}>Log in</Link></Button>
                  <Button variant="hero" size="sm" className="flex-1" asChild><Link to="/register" onClick={() => setOpen(false)}>Sign up</Link></Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
