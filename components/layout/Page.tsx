import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className,
  narrow = false,
}: {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
}) {
  return (
    <div className={cn("mx-auto w-full px-4 py-section", narrow ? "max-w-3xl" : "max-w-7xl", className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  className,
  action,
}: {
  title: string;
  description?: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div className={cn("mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="space-y-1.5">
        <h1 className="text-title sm:text-3xl sm:font-bold sm:tracking-tight">{title}</h1>
        {description ? (
          <div className="max-w-2xl text-sm text-muted-foreground sm:text-base [&_strong]:font-medium [&_strong]:text-foreground">
            {description}
          </div>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function SectionHeader({ title, className }: { title: string; className?: string }) {
  return <h2 className={cn("mb-4 text-lg font-semibold tracking-tight sm:mb-5 sm:text-xl", className)}>{title}</h2>;
}

export function PageEmptyState({
  icon,
  title,
  description,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border/80 bg-muted/25 px-4 py-14 text-center dark:border-border/60 dark:bg-muted/20",
        className
      )}
    >
      {icon ? <div className="mx-auto mb-3 flex w-fit text-muted-foreground/70">{icon}</div> : null}
      <p className="font-medium">{title}</p>
      {description ? <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}
