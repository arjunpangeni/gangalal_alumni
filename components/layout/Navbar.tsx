"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import { isNavActive } from "@/lib/nav-active";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
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
import { useState } from "react";
import { NETWORK_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/members", label: "Members" },
  { href: "/articles", label: "Articles" },
  { href: "/events", label: "Events" },
  { href: "/jobs", label: "Jobs" },
  { href: "/gallery", label: "Gallery" },
  { href: "/mentorship", label: "Mentorship" },
];

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navClass = (href: string) =>
    cn(
      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      isNavActive(pathname, href)
        ? "bg-primary/12 text-primary dark:bg-primary/20 dark:text-primary"
        : "text-muted-foreground hover:bg-accent hover:text-foreground"
    );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/85 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 dark:border-border/60">
      <div className="container mx-auto flex h-14 items-center justify-between gap-2 px-4 sm:h-16">
        {/* Logo */}
        <Link href="/" className="flex min-w-0 items-center gap-2 rounded-lg py-1 font-bold text-base transition-opacity hover:opacity-90 sm:text-lg">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg gradient-primary shadow-sm">
            <GraduationCap className="size-5 text-white" />
          </div>
          <span className="hidden truncate gradient-text sm:inline">{NETWORK_NAME}</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={navClass(link.href)} aria-current={isNavActive(pathname, link.href) ? "page" : undefined}>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
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
                  <LayoutDashboard className="mr-2 size-4" />Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}>
                  <Settings className="mr-2 size-4" />Profile
                </DropdownMenuItem>
                {(session.user.role === "admin" || session.user.role === "superadmin") && (
                  <DropdownMenuItem onClick={() => router.push("/admin/users")}>
                    <Shield className="mr-2 size-4" />Admin Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="text-destructive">
                  <LogOut className="mr-2 size-4" />Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => signIn("google")} size="sm" className="gradient-primary text-white border-0">
              Sign In
            </Button>
          )}

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger className="md:hidden inline-flex size-9 items-center justify-center rounded-lg hover:bg-muted transition-colors">
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100vw-2rem,20rem)]">
              <nav className="mt-6 flex flex-col gap-1" aria-label="Mobile main">
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className={cn("flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors", navClass("/"))}
                  aria-current={pathname === "/" ? "page" : undefined}
                >
                  <Home className="size-4 opacity-70" aria-hidden />
                  Home
                </Link>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn("px-4 py-3 text-sm font-medium rounded-lg transition-colors", navClass(link.href))}
                    aria-current={isNavActive(pathname, link.href) ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
