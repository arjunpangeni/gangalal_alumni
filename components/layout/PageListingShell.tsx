import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Soft page backdrop strip behind listing pages for visual continuity with the home hero. */
export function PageListingShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative min-h-[50vh]", className)}>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-primary/[0.06] via-transparent to-transparent dark:from-primary/[0.1]"
        aria-hidden
      />
      <div className="relative">{children}</div>
    </div>
  );
}
