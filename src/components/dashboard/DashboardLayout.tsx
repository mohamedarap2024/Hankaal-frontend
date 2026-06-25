import type { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Home, LogOut } from "lucide-react";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";

export type DashboardNavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number | string;
};

type DashboardLayoutProps = {
  panelTitle: string;
  panelSubtitle?: string;
  navItems: DashboardNavItem[];
  activeId: string;
  onNavigate: (id: string) => void;
  user?: User | null;
  onLogout?: () => void;
  homeHref?: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
};

export function DashboardLayout({
  panelTitle,
  panelSubtitle,
  navItems,
  activeId,
  onNavigate,
  user,
  onLogout,
  homeHref = "/",
  children,
  headerActions,
}: DashboardLayoutProps) {
  const activeItem = navItems.find((n) => n.id === activeId);

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        <SidebarHeader className="p-3">
          <Link to={homeHref} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-sidebar-accent/50">
            <Logo size={32} />
            <div className="group-data-[collapsible=icon]:hidden min-w-0">
              <div className="font-display font-bold text-sm truncate">Hankaal</div>
              <div className="text-[10px] text-muted-foreground truncate">{panelTitle}</div>
            </div>
          </Link>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={activeId === item.id}
                    onClick={() => onNavigate(item.id)}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="ml-auto text-[10px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-full group-data-[collapsible=icon]:hidden">
                        {item.badge}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Back to site">
                <Link to={homeHref}>
                  <Home />
                  <span>Back to site</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {onLogout && (
              <SidebarMenuItem>
                <SidebarMenuButton onClick={onLogout} tooltip="Log out">
                  <LogOut />
                  <span>Log out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
          {user && (
            <div className="px-3 py-2 mt-1 rounded-lg bg-sidebar-accent/40 group-data-[collapsible=icon]:hidden">
              <div className="text-xs font-semibold truncate">{user.name}</div>
              <div className="text-[10px] text-muted-foreground truncate">{user.email}</div>
            </div>
          )}
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-h-svh bg-muted/20">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/90 backdrop-blur px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-bold text-lg truncate leading-tight">
              {activeItem?.label ?? panelTitle}
            </h1>
            {panelSubtitle && (
              <p className="text-xs text-muted-foreground truncate hidden sm:block">{panelSubtitle}</p>
            )}
          </div>
          {headerActions}
        </header>

        {/* Mobile: visible section tabs so users never have to find the hidden sidebar. */}
        <nav className="md:hidden flex gap-2 overflow-x-auto border-b border-border bg-background/95 px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                activeId === item.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              {item.badge !== undefined && (
                <span className="text-[10px] font-bold bg-background/30 px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function DashboardSection({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-5", className)}>
      {(title || description) && (
        <div>
          {title && <h2 className="text-xl font-display font-bold">{title}</h2>}
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatGrid({
  items,
}: {
  items: { icon: LucideIcon; label: string; value: string | number; accent?: string }[];
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="p-4 md:p-5 rounded-2xl bg-card border border-border shadow-sm hover:border-primary/20 transition-colors"
        >
          <div
            className="h-9 w-9 rounded-xl grid place-items-center text-white mb-3"
            style={{ background: item.accent ?? "var(--gradient-hero)" }}
          >
            <item.icon className="h-4 w-4" />
          </div>
          <div className="text-2xl font-display font-bold">{item.value}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

export function ContentCard({
  children,
  className,
  noPadding,
}: {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card shadow-sm", !noPadding && "p-5 md:p-6", className)}>
      {children}
    </div>
  );
}
