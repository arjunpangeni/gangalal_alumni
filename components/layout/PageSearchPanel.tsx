"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type PageSearchPanelProps = {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
  className?: string;
};

/** Shared search / filter shell for listing pages (warm card, indigo accent). */
export function PageSearchPanel({ icon: Icon, label, children, className }: PageSearchPanelProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-card ring-1 ring-primary/[0.07] transition-surface",
        "hover:shadow-[0_2px_8px_oklch(0.35_0.08_264/0.08),0_12px_32px_oklch(0.35_0.1_264/0.1)]",
        "dark:border-border/50 dark:bg-card/90 dark:ring-primary/[0.1]",
        "sm:rounded-3xl",
        className
      )}
    >
      <div className="border-b border-border/50 bg-gradient-to-r from-primary/[0.07] via-muted/40 to-indigo-500/[0.05] px-4 py-3 dark:from-primary/[0.12] dark:via-muted/25 dark:to-indigo-500/[0.08] sm:px-5">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:text-xs">
          <Icon className="size-3.5 shrink-0 text-primary" aria-hidden />
          {label}
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}
