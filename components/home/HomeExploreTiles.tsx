"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, BookOpen, Briefcase, Calendar, Images, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/I18nProvider";

const tiles = [
  { href: "/members", labelId: "nav.members", subId: "homeExplore.membersSub", icon: Users },
  { href: "/articles", labelId: "nav.articles", subId: "homeExplore.articlesSub", icon: BookOpen },
  { href: "/events", labelId: "nav.events", subId: "homeExplore.eventsSub", icon: Calendar },
  { href: "/gallery", labelId: "nav.gallery", subId: "homeExplore.gallerySub", icon: Images },
  { href: "/jobs", labelId: "nav.jobs", subId: "homeExplore.jobsSub", icon: Briefcase },
] as const;

export function HomeExploreTiles() {
  const { messages } = useI18n();
  const reduceMotion = useReducedMotion();
  const text = (id: string, fallback: string) => {
    const resolved = id.split(".").reduce<unknown>((acc, part) => {
      if (typeof acc === "object" && acc !== null && part in (acc as Record<string, unknown>)) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, messages);
    return typeof resolved === "string" ? resolved : fallback;
  };

  return (
    <div className="flex h-full flex-col justify-center gap-5 sm:gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground sm:text-[13px]">{text("homeExplore.explore", "Explore")}</p>
        <p className="mt-2 font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">{text("homeExplore.jumpIn", "Jump in")}</p>
      </div>
      <motion.ul
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-3.5 lg:grid-cols-5"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-15%" }}
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: reduceMotion ? 0 : 0.04 } },
        }}
      >
        {tiles.map(({ href, labelId, subId, icon: Icon }) => (
          <motion.li
            key={href}
            variants={{
              hidden: reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: reduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] },
              },
            }}
          >
            <Link
              href={href}
              className={cn(
                "group flex flex-col gap-1.5 rounded-xl border border-border/45 bg-background/85 p-3.5 transition-surface sm:p-4",
                "hover:-translate-y-0.5 hover:border-primary/28 hover:bg-primary/[0.04] hover:shadow-sm",
                "dark:border-border/40 dark:bg-background/45 dark:hover:bg-primary/[0.08]"
              )}
            >
              <span className="flex items-center justify-between gap-1">
                <Icon className="size-[1.125rem] text-primary transition-transform duration-300 group-hover:scale-110 sm:size-5" aria-hidden />
                <ArrowUpRight
                  className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
                  aria-hidden
                />
              </span>
              <span className="text-[15px] font-bold leading-snug text-foreground sm:text-base">{text(labelId, "")}</span>
              <span className="text-[12px] leading-relaxed text-muted-foreground sm:text-[13px]">{text(subId, "")}</span>
            </Link>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}
