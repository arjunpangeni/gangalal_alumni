"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, BookOpen, Calendar, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/I18nProvider";

const items = [
  { href: "/", icon: Home, key: "home" },
  { href: "/members", icon: Users, key: "members" },
  { href: "/articles", icon: BookOpen, key: "articles" },
  { href: "/events", icon: Calendar, key: "events" },
  { href: "/jobs", icon: Briefcase, key: "jobs" },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const { messages } = useI18n();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background/95 backdrop-blur-xl">
      <div className="flex items-center justify-around py-2">
        {items.map(({ href, icon: Icon, key }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-[3.25rem] flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition-colors touch-manipulation",
                active
                  ? "bg-primary/12 text-primary dark:bg-primary/20"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              <Icon className="size-5" aria-hidden />
              <span className="text-[10px] font-semibold leading-none">{messages.nav[key]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
