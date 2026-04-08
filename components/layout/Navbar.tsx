"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { isNavActive } from "@/lib/nav-active";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, GraduationCap, Home, LayoutDashboard, LogOut, Settings, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/I18nProvider";

const navLinks = [
  { href: "/members", key: "members" },
  { href: "/articles", key: "articles" },
  { href: "/events", key: "events" },
  { href: "/jobs", key: "jobs" },
  { href: "/gallery", key: "gallery" },
  { href: "/mentorship", key: "mentorship" },
] as const;

function JobsCountBadge({ count }: { count: number }) {
  const label = count > 99 ? "99+" : String(count);
  return (
    <span
      className="inline-flex min-w-[1.25rem] shrink-0 justify-center rounded-full bg-muted px-1.5 py-0 text-xs font-semibold leading-5 text-foreground tabular-nums ring-1 ring-border"
      aria-hidden
    >
      {label}
    </span>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeJobsCount, setActiveJobsCount] = useState<number | null>(null);
  const { messages } = useI18n();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/jobs/count");
        const json = await res.json();
        if (!cancelled && res.ok && json.success && typeof json.data?.count === "number") {
          setActiveJobsCount(json.data.count);
        }
      } catch {
        if (!cancelled) setActiveJobsCount(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const navClass = (href: string) =>
    cn(
      "rounded-lg px-3 py-2 text-sm font-medium transition-colors lg:px-4 lg:py-2.5 lg:text-base xl:px-[1.125rem] xl:py-2.5 xl:text-[1.0625rem]",
      isNavActive(pathname, href)
        ? "bg-primary/12 text-primary dark:bg-primary/20 dark:text-primary"
        : "text-muted-foreground hover:bg-accent hover:text-foreground"
    );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/90 shadow-[0_1px_3px_oklch(0.35_0.08_264/0.06)] backdrop-blur-xl transition-surface supports-[backdrop-filter]:bg-background/75 dark:border-border/50">
      <div className="container mx-auto flex h-14 items-center justify-between gap-2 px-4 sm:h-16 lg:h-[4.25rem] lg:gap-3 lg:px-5 xl:h-[4.5rem]">
        {/* Logo */}
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 rounded-lg py-1 font-bold text-base transition-opacity hover:opacity-90 sm:text-lg lg:gap-2.5 lg:text-xl xl:text-[1.35rem]"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg gradient-primary shadow-sm lg:size-9 xl:size-10">
            <GraduationCap className="size-5 text-white lg:size-5 xl:size-6" />
          </div>
          <span className="hidden truncate gradient-text sm:inline">{messages.brand.name}</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-0.5 md:flex lg:gap-1 xl:gap-1.5" aria-label={messages.nav.main}>
          {navLinks.map((link) => {
            const showJobsBadge =
              link.href === "/jobs" && activeJobsCount != null && activeJobsCount > 0;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(navClass(link.href), "inline-flex items-center gap-1.5")}
                aria-current={isNavActive(pathname, link.href) ? "page" : undefined}
                aria-label={
                  showJobsBadge
                    ? `${messages.nav[link.key]}, ${activeJobsCount} ${
                        activeJobsCount === 1
                          ? messages.publicClients.listing
                          : messages.publicClients.listings
                      }`
                    : undefined
                }
              >
                {messages.nav[link.key]}
                {showJobsBadge ? <JobsCountBadge count={activeJobsCount} /> : null}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="relative size-9 rounded-full overflow-hidden border-2 border-border hover:border-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="size-full">
                  <AvatarImage
                    key={session.user.image ?? "no-image"}
                    src={session.user.image ?? ""}
                    alt={session.user.name ?? ""}
                  />
                  <AvatarFallback>{session.user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium">{session.user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                  <LayoutDashboard className="mr-2 size-4" />
                  {messages.auth.dashboard}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                  <Settings className="mr-2 size-4" />
                  {messages.auth.profile}
                </DropdownMenuItem>
                {(session.user.role === "admin" || session.user.role === "superadmin") && (
                  <DropdownMenuItem onClick={() => router.push("/admin/users")}>
                    <Shield className="mr-2 size-4" />
                    {messages.auth.adminPanel}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                  <LogOut className="mr-2 size-4" />
                  {messages.auth.signOut}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => signIn("google")}
              size="sm"
              className="gradient-primary border-0 text-white lg:h-10 lg:px-4 lg:text-[0.9375rem] xl:h-11 xl:px-5 xl:text-base"
            >
              {messages.auth.signIn}
            </Button>
          )}

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger className="md:hidden inline-flex size-9 items-center justify-center rounded-lg hover:bg-muted transition-colors">
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100vw-2rem,20rem)]">
              <nav className="mt-6 flex flex-col gap-1" aria-label={messages.nav.main}>
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className={cn("flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors", navClass("/"))}
                  aria-current={pathname === "/" ? "page" : undefined}
                >
                  <Home className="size-4 opacity-70" aria-hidden />
                  {messages.nav.home}
                </Link>
                {navLinks.map((link) => {
                  const showJobsBadge =
                    link.href === "/jobs" && activeJobsCount != null && activeJobsCount > 0;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                        navClass(link.href)
                      )}
                      aria-current={isNavActive(pathname, link.href) ? "page" : undefined}
                      aria-label={
                        showJobsBadge
                          ? `${messages.nav[link.key]}, ${activeJobsCount} ${
                              activeJobsCount === 1
                                ? messages.publicClients.listing
                                : messages.publicClients.listings
                            }`
                          : undefined
                      }
                    >
                      <span className="min-w-0 flex-1">{messages.nav[link.key]}</span>
                      {showJobsBadge ? <JobsCountBadge count={activeJobsCount} /> : null}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
