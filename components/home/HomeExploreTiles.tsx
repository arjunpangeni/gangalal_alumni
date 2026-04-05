import Link from "next/link";
import { ArrowUpRight, BookOpen, Briefcase, Calendar, Images, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const tiles = [
  { href: "/members", label: "Members", sub: "Directory", icon: Users },
  { href: "/articles", label: "Articles", sub: "Read & share", icon: BookOpen },
  { href: "/events", label: "Events", sub: "Gatherings", icon: Calendar },
  { href: "/gallery", label: "Gallery", sub: "Photos", icon: Images },
  { href: "/jobs", label: "Jobs", sub: "Opportunities", icon: Briefcase },
] as const;

export function HomeExploreTiles() {
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Explore</p>
        <p className="mt-1 font-heading text-lg font-semibold text-foreground">Jump in</p>
      </div>
      <ul className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {tiles.map(({ href, label, sub, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className={cn(
                "group flex flex-col gap-1 rounded-2xl border border-border/50 bg-background/80 p-3 transition-surface",
                "hover:border-primary/25 hover:bg-primary/[0.04] hover:shadow-md dark:border-border/40 dark:bg-background/40 dark:hover:bg-primary/[0.08]"
              )}
            >
              <span className="flex items-center justify-between gap-1">
                <Icon className="size-4 text-primary" aria-hidden />
                <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
              </span>
              <span className="text-sm font-semibold text-foreground">{label}</span>
              <span className="text-[11px] text-muted-foreground">{sub}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
