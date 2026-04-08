import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users } from "lucide-react";
import { formatDate, formatDateDayMonth } from "@/lib/utils";

interface EventCardProps {
  title: string;
  slug: string;
  description: string;
  startDate: string | Date;
  venue: string;
  capacity?: number;
  tags?: string[];
  variant?: "default" | "compact";
  /** Homepage news-style density */
  editorial?: boolean;
}

export function EventCard({
  title,
  slug,
  description,
  startDate,
  venue,
  capacity,
  tags,
  variant = "default",
  editorial = false,
}: EventCardProps) {
  const compact = variant === "compact";
  const news = compact && editorial;
  const isPast = new Date(startDate) < new Date();
  const bsDate = formatDateDayMonth(startDate);

  return (
    <article
      className={
        news
          ? "group flex h-full flex-col rounded-xl border border-border/50 bg-card/95 p-4 shadow-sm ring-1 ring-primary/[0.03] transition-surface hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md dark:border-border/45 sm:p-4"
          : compact
            ? "group flex h-full flex-col rounded-xl border border-border/55 bg-card/95 p-3 shadow-sm ring-1 ring-primary/[0.03] transition-surface hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md dark:border-border/45 sm:p-3.5"
            : "group flex h-full flex-col rounded-2xl border border-border/60 bg-card/95 p-5 shadow-card ring-1 ring-primary/[0.04] transition-surface hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_12px_36px_oklch(0.35_0.1_264/0.12)] dark:border-border/45 sm:rounded-3xl sm:p-6"
      }
    >
      <div className={compact ? "mb-2 flex items-start justify-between gap-2" : "mb-3 flex items-start justify-between gap-2"}>
        <div
          className={
            compact
              ? "flex h-9 w-14 shrink-0 flex-col items-center justify-center rounded-md gradient-primary text-white text-[0.6rem] font-bold leading-tight"
              : "flex h-10 w-20 shrink-0 flex-col items-center justify-center rounded-lg gradient-primary text-white text-[0.65rem] font-bold leading-tight"
          }
        >
          <span>{bsDate.day}</span>
          <span>{bsDate.month}</span>
        </div>
        <Badge variant={isPast ? "secondary" : "default"} className={compact ? "shrink-0 text-[10px]" : "shrink-0"}>
          {isPast ? "Past" : "Upcoming"}
        </Badge>
      </div>
      <h3
        className={
          news
            ? "font-heading mb-2 text-[0.9375rem] font-bold leading-snug transition-surface group-hover:text-primary line-clamp-2 sm:text-base"
            : compact
              ? "font-heading mb-1.5 text-sm font-semibold leading-snug transition-surface group-hover:text-primary line-clamp-2"
              : "font-heading mb-2 font-semibold leading-snug transition-surface group-hover:text-primary line-clamp-2"
        }
      >
        <Link href={`/events/${slug}`}>{title}</Link>
      </h3>
      <p
        className={
          news
            ? "mb-2 line-clamp-2 text-[0.8125rem] leading-[1.6] text-muted-foreground sm:text-[0.875rem]"
            : compact
              ? "mb-2 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground"
              : "text-sm text-muted-foreground mb-4 line-clamp-2"
        }
      >
        {description}
      </p>
      <div
        className={
          news ? "mt-auto space-y-1 text-[11px] leading-normal text-muted-foreground sm:text-xs" : compact ? "mt-auto space-y-0.5 text-[10px] text-muted-foreground" : "mt-auto space-y-1 text-xs text-muted-foreground"
        }
      >
        <div className="flex items-center gap-1.5">
          <Calendar className="size-3 shrink-0" aria-hidden />
          <span>{formatDate(startDate)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="size-3 shrink-0" aria-hidden />
          <span className="line-clamp-1">{venue}</span>
        </div>
        {capacity && (
          <div className="flex items-center gap-1.5">
            <Users className="size-3 shrink-0" aria-hidden />
            <span>{capacity} seats</span>
          </div>
        )}
      </div>
      {tags && tags.length > 0 && (
        <div className={compact ? "mt-2 flex flex-wrap gap-1" : "mt-3 flex flex-wrap gap-1"}>
          {tags.slice(0, compact ? 2 : 3).map((tag) => (
            <Badge key={tag} variant="outline" className={compact ? "px-1.5 py-0 text-[10px]" : "text-xs"}>
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </article>
  );
}
