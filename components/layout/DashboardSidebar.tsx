"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
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
  Mail,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { ADMIN_CONTACTS_PENDING_COUNT_EVENT } from "@/lib/admin-contact-events";

function NavCountBadge({ count }: { count: number }) {
  const label = count > 99 ? "99+" : String(count);
  return (
    <span
      className="inline-flex min-w-[1.125rem] shrink-0 justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-destructive-foreground tabular-nums"
      aria-hidden
    >
      {label}
    </span>
  );
}

const memberLinks = [
  { href: "/dashboard", icon: LayoutDashboard, key: "auth.dashboard" },
  { href: "/dashboard/profile", icon: User, key: "dashboard.myProfile" },
  { href: "/dashboard/articles", icon: BookOpen, key: "dashboard.yourArticles" },
  { href: "/dashboard/jobs", icon: Briefcase, key: "dashboard.jobs" },
  { href: "/dashboard/mentorship", icon: Heart, key: "dashboard.mentorship" },
];

const adminLinks = [
  { href: "/admin/users", icon: Users, key: "admin.users" },
  { href: "/admin/notices", icon: Megaphone, key: "admin.notices" },
  { href: "/admin/contacts", icon: Mail, key: "admin.contacts" },
  { href: "/admin/articles", icon: BookOpen, key: "nav.articles" },
  { href: "/admin/events", icon: Calendar, key: "nav.events" },
  { href: "/admin/jobs", icon: Briefcase, key: "dashboard.jobs" },
  { href: "/admin/gallery", icon: Image, key: "nav.gallery" },
];

const superAdminLinks = [
  { href: "/admin/admins", icon: Shield, key: "admin.manageAdmins" },
  { href: "/admin/committee", icon: UsersRound, key: "admin.committee" },
  { href: "/admin/audit", icon: ClipboardList, key: "admin.auditLogs" },
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
  pendingContactCount,
}: {
  items: { href: string; icon: LucideIcon; key: string }[];
  pathname: string;
  onNavigate?: () => void;
  pendingContactCount?: number | null;
}) {
  const { messages } = useI18n();
  const t = (key: string): string =>
    key.split(".").reduce<unknown>((acc, part) => (acc as Record<string, unknown>)?.[part], messages) as string;

  return (
    <>
      {items.map(({ href, icon: Icon, key }) => {
        const showPendingBadge =
          href === "/admin/contacts" && pendingContactCount != null && pendingContactCount > 0;
        return (
          <Link
            key={href}
            href={href}
            prefetch={false}
            onClick={onNavigate}
            aria-label={
              showPendingBadge
                ? `${t(key)}, ${pendingContactCount} ${messages.adminContacts.statusPending}`
                : undefined
            }
            className={cn(
              "flex min-h-11 w-full items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-manipulation",
              pathIsActive(pathname, href)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{t(key)}</span>
            {showPendingBadge ? <NavCountBadge count={pendingContactCount} /> : null}
          </Link>
        );
      })}
    </>
  );
}

function useAdminPendingContactCount(enabled: boolean) {
  const pathname = usePathname();
  const [pendingContactCount, setPendingContactCount] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    try {
      const res = await fetch("/api/admin/contacts/pending-count", { credentials: "include" });
      const json = await res.json();
      if (res.ok && json.success && typeof json.data?.pending === "number") {
        setPendingContactCount(json.data.pending);
      }
    } catch {
      /* ignore */
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setPendingContactCount(null);
      return;
    }
    void load();
  }, [enabled, load, pathname]);

  useEffect(() => {
    if (!enabled) return;
    const onRefresh = () => void load();
    window.addEventListener(ADMIN_CONTACTS_PENDING_COUNT_EVENT, onRefresh);
    return () => window.removeEventListener(ADMIN_CONTACTS_PENDING_COUNT_EVENT, onRefresh);
  }, [enabled, load]);

  return pendingContactCount;
}

export function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isStaff = role === "admin" || role === "superadmin";
  const pendingContactCount = useAdminPendingContactCount(isStaff);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);
  const { messages } = useI18n();
  const t = (key: string): string =>
    key.split(".").reduce<unknown>((acc, part) => (acc as Record<string, unknown>)?.[part], messages) as string;

  const isActive = (href: string) => pathIsActive(pathname, href);

  return (
    <div className="w-full shrink-0 md:w-56 md:min-h-[calc(100vh-4rem)] md:border-r md:bg-muted/20">
      <div className="flex h-14 items-center gap-3 border-b bg-muted/30 px-4 md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground hover:bg-accent">
            <Menu className="size-5" />
            <span className="sr-only">{messages.dashboard.openMenu}</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(100%,20rem)]">
            <SheetHeader>
              <SheetTitle>{messages.auth.dashboard}</SheetTitle>
            </SheetHeader>
            <nav className="flex max-h-[calc(100vh-8rem)] flex-col gap-1 overflow-y-auto pb-6">
              <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{messages.dashboard.member}</p>
              <NavLinks items={memberLinks} pathname={pathname} onNavigate={closeMobile} />
              {(role === "admin" || role === "superadmin") && (
                <>
                  <p className="px-3 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{messages.dashboard.admin}</p>
                  <NavLinks
                    items={adminLinks}
                    pathname={pathname}
                    onNavigate={closeMobile}
                    pendingContactCount={pendingContactCount}
                  />
                </>
              )}
              {role === "superadmin" && (
                <>
                  <p className="px-3 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {messages.dashboard.superadmin}
                  </p>
                  <NavLinks items={superAdminLinks} pathname={pathname} onNavigate={closeMobile} />
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
        <span className="truncate text-sm font-medium text-muted-foreground">{messages.dashboard.navigation}</span>
      </div>

      <aside className="hidden md:flex min-h-[calc(100vh-4rem)] w-56 flex-col gap-1 border-0 bg-transparent p-4">
        <div className="mb-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{messages.dashboard.member}</p>
          {memberLinks.map(({ href, icon: Icon, key }) => (
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
              {t(key)}
            </Link>
          ))}
        </div>

        {(role === "admin" || role === "superadmin") && (
          <div className="mb-4">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{messages.dashboard.admin}</p>
            {adminLinks.map(({ href, icon: Icon, key }) => {
              const showPendingBadge =
                href === "/admin/contacts" && pendingContactCount != null && pendingContactCount > 0;
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch={false}
                  aria-label={
                    showPendingBadge
                      ? `${t(key)}, ${pendingContactCount} ${messages.adminContacts.statusPending}`
                      : undefined
                  }
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive(href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{t(key)}</span>
                  {showPendingBadge ? <NavCountBadge count={pendingContactCount} /> : null}
                </Link>
              );
            })}
          </div>
        )}

        {role === "superadmin" && (
          <div>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{messages.dashboard.superadmin}</p>
            {superAdminLinks.map(({ href, icon: Icon, key }) => (
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
                {t(key)}
              </Link>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}
