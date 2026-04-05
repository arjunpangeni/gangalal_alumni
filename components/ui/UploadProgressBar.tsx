"use client";

import { cn } from "@/lib/utils";

type Props = {
  /** 0–100 when known */
  value?: number;
  indeterminate?: boolean;
  className?: string;
  label?: string;
};

export function UploadProgressBar({ value = 0, indeterminate, className, label }: Props) {
  const pct = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? <p className="text-xs text-muted-foreground">{label}</p> : null}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={indeterminate ? undefined : pct}
        aria-busy={indeterminate}
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        {indeterminate ? (
          <div className="h-full w-full rounded-full bg-primary/35 motion-safe:animate-pulse" />
        ) : (
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
      {!indeterminate ? <p className="text-xs tabular-nums text-muted-foreground">{pct}%</p> : null}
    </div>
  );
}
