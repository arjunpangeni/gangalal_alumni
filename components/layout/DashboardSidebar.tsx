"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  User,
  Users,
  Calendar,
  Briefcase,
  Image,
  ClipboardList,
  BookOpen,
  Heart,
  Shield,
  Megaphone,
  Menu,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const memberLinks = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/profile", icon: User, label: "My Profile" },
  { href: "/dashboard/articles", icon: BookOpen, label: "Articles" },
  { href: "/dashboard/jobs", icon: Briefcase, label: "Jobs" },
  { href: "/dashboard/mentorship", icon: Heart, label: "Mentorship" },
];

const adminLinks = [
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/notices", icon: Megaphone, label: "Notices" },
  { href: "/admin/articles", icon: BookOpen, label: "Articles" },
  { href: "/admin/events", icon: Calendar, label: "Events" },
  { href: "/admin/jobs", icon: Briefcase, label: "Jobs" },
  { href: "/admin/gallery", icon: Image, label: "Gallery" },
];

const superAdminLinks = [
  { href: "/admin/admins", icon: Shield, label: "Manage Admins" },
  { href: "/admin/audit", icon: ClipboardList, label: "Audit Logs" },
];

function pathIsActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  if (href === "/dashboard/articles") {
    return pathname.startsWith("/dashboard/articles") || pathname.startsWith("/content/");
  }
  if (href === "/dashboard/jobs") {
    return pathname.startsWith("/dashboard/jobs");
  }
  return pathname.startsWith(href);
}

function NavLinks({
  items,
  pathname,
  onNavigate,
}: {
  items: { href: string; icon: LucideIcon; label: string }[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {items.map(({ href, icon: Icon, label }) => (
        <Link
          key={href}
          href={href}
          prefetch={false}
          onClick={onNavigate}
          className={cn(
            "flex min-h-11 items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-manipulation",
            pathIsActive(pathname, href)
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <Icon className="size-4 shrink-0" />
          {label}
        </Link>
      ))}
    </>
  );
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);

  const isActive = (href: string) => pathIsActive(pathname, href);

  return (
    <div className="w-full shrink-0 md:w-56 md:min-h-[calc(100vh-4rem)] md:border-r md:bg-muted/20">
      <div className="flex h-14 items-center gap-3 border-b bg-muted/30 px-4 md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-accent">
            <Menu className="size-5" />
            <span className="sr-only">Open dashboard menu</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(100%,20rem)]">
            <SheetHeader>
              <SheetTitle>Dashboard</SheetTitle>
            </SheetHeader>
            <nav className="flex max-h-[calc(100vh-8rem)] flex-col gap-1 overflow-y-auto pb-6">
              <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Member</p>
              <NavLinks items={memberLinks} pathname={pathname} onNavigate={closeMobile} />
              {(role === "admin" || role === "superadmin") && (
                <>
                  <p className="px-3 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin</p>
                  <NavLinks items={adminLinks} pathname={pathname} onNavigate={closeMobile} />
                </>
              )}
              {role === "superadmin" && (
                <>
                  <p className="px-3 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Superadmin
                  </p>
                  <NavLinks items={superAdminLinks} pathname={pathname} onNavigate={closeMobile} />
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
        <span className="truncate text-sm font-medium text-muted-foreground">Dashboard navigation</span>
      </div>

      <aside className="hidden md:flex min-h-[calc(100vh-4rem)] w-56 flex-col gap-1 border-0 bg-transparent p-4">
        <div className="mb-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Member</p>
          {memberLinks.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive(href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </div>

        {(role === "admin" || role === "superadmin") && (
          <div className="mb-4">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin</p>
            {adminLinks.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                prefetch={false}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive(href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </div>
        )}

        {role === "superadmin" && (
          <div>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Superadmin</p>
            {superAdminLinks.map(({ href, icon: Icon, label }) => (
              <Link
                key={href}
                href={href}
                prefetch={false}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive(href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
