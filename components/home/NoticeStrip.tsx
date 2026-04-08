"use client";

import Link from "next/link";
import { Megaphone, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button-variants";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/utils";

export interface HomeNotice {
  _id: string;
  title: string;
  body: string;
  linkUrl?: string;
  linkLabel?: string;
  expiresAt?: string | Date;
}

export function NoticeStrip({ notices, embedded }: { notices: HomeNotice[]; embedded?: boolean }) {
  const { messages } = useI18n();
  const reduceMotion = useReducedMotion();

  if (!notices.length) return null;

  const header = (
    <div className="mb-3 flex flex-wrap items-center gap-2 sm:mb-4">
      <div className="relative flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="relative inline-flex">
          {!reduceMotion ? (
            <span
              className="absolute inset-0 rounded-full bg-primary/20 opacity-50 motion-safe:animate-[ping_2.2s_cubic-bezier(0,0,0.2,1)_infinite]"
              aria-hidden
            />
          ) : null}
          <Megaphone
            className={cn("relative size-4 shrink-0 text-primary", !reduceMotion && "home-notice-icon")}
            aria-hidden
          />
        </span>
        <span className="inline-flex items-center gap-1.5 font-heading">
          {messages.home.noticesTitle}
          <Sparkles className="size-3.5 text-amber-500/90 dark:text-amber-400/90" aria-hidden />
        </span>
      </div>
      {!reduceMotion ? (
        <span className="hidden rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary sm:inline dark:bg-primary/15">
          Live
        </span>
      ) : null}
    </div>
  );

  const listClass = embedded
    ? "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
    : "flex flex-col gap-3 sm:gap-4";

  const itemClass = embedded
    ? cn(
        "group/notice relative overflow-hidden rounded-2xl border border-border/50 bg-card/90 px-3 py-3 shadow-sm",
        "ring-1 ring-primary/[0.06] transition-[transform,box-shadow,border-color] duration-300",
        "hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_12px_36px_-12px_oklch(0.45_0.14_264/0.22)]",
        "dark:border-border/40 dark:bg-card/85 dark:ring-primary/[0.08] dark:hover:border-primary/30",
        "sm:px-4 sm:py-4"
      )
    : cn(
        "group/notice relative overflow-hidden rounded-2xl border border-border/60 bg-card/95 px-4 py-4 shadow-card",
        "ring-1 ring-primary/[0.06] transition-[transform,box-shadow,border-color] duration-300",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_14px_40px_oklch(0.35_0.1_264/0.12)]",
        "dark:border-border/50 dark:bg-card/90 sm:rounded-3xl sm:px-5 sm:py-5"
      );

  const listVariants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduceMotion ? 0 : 0.09, delayChildren: reduceMotion ? 0 : 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  const list = (
    <motion.ul
      className={listClass}
      variants={listVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
    >
      {notices.map((n) => (
        <motion.li
          key={n._id}
          variants={itemVariants}
          className={itemClass}
          whileHover={reduceMotion ? undefined : { scale: 1.01 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
        >
          <span
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/notice:opacity-100"
            aria-hidden
            style={{
              background:
                "radial-gradient(ellipse 90% 70% at 50% -30%, oklch(0.58 0.16 264 / 0.12), transparent 55%)",
            }}
          />
          <div className="relative">
            <h3
              className={
                embedded
                  ? "font-heading text-sm font-semibold leading-snug text-foreground sm:text-base"
                  : "font-heading text-base font-semibold text-foreground sm:text-lg"
              }
            >
              {n.title}
            </h3>
            <p
              className={
                embedded
                  ? "mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground sm:text-sm"
                  : "mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground"
              }
            >
              {n.body}
            </p>
            {n.linkUrl?.trim() ? (
              <div className="mt-2">
                <Link
                  href={n.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "transition-colors hover:border-primary/40 hover:bg-primary/5"
                  )}
                >
                  {n.linkLabel?.trim() || messages.home.learnMore}
                </Link>
              </div>
            ) : null}
          </div>
        </motion.li>
      ))}
    </motion.ul>
  );

  const innerBody = (
    <>
      {header}
      {list}
    </>
  );

  if (embedded) {
    return (
      <div aria-live="polite" className="home-notice-frame">
        <div className="home-notice-inner border border-border/30 px-4 py-4 sm:px-5 sm:py-5 dark:border-border/25">
          {innerBody}
        </div>
      </div>
    );
  }

  return (
    <section className="border-b border-primary/10 py-6 dark:border-primary/15 sm:py-8">
      <div className="container mx-auto px-4">
        <div className="home-notice-frame">
          <div className="home-notice-inner border border-border/30 px-4 py-5 sm:px-6 sm:py-6 dark:border-border/25">
            {innerBody}
          </div>
        </div>
      </div>
    </section>
  );
}
