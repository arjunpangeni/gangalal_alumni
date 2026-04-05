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
}

export function EventCard({ title, slug, description, startDate, venue, capacity, tags }: EventCardProps) {
  const isPast = new Date(startDate) < new Date();
  const bsDate = formatDateDayMonth(startDate);

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-border/60 bg-card/95 p-5 shadow-card ring-1 ring-primary/[0.04] transition-surface hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_12px_36px_oklch(0.35_0.1_264/0.12)] dark:border-border/45 sm:rounded-3xl sm:p-6">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex h-10 w-20 shrink-0 flex-col items-center justify-center rounded-lg gradient-primary text-white text-[0.65rem] font-bold leading-tight">
          <span>{bsDate.day}</span>
          <span>{bsDate.month}</span>
        </div>
        <Badge variant={isPast ? "secondary" : "default"} className="shrink-0">
          {isPast ? "Past" : "Upcoming"}
        </Badge>
      </div>
      <h3 className="font-heading mb-2 font-semibold leading-snug transition-surface group-hover:text-primary line-clamp-2">
        <Link href={`/events/${slug}`}>{title}</Link>
      </h3>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>
      <div className="mt-auto space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Calendar className="size-3 shrink-0" />
          <span>{formatDate(startDate)}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="size-3 shrink-0" />
          <span className="line-clamp-1">{venue}</span>
        </div>
        {capacity && (
          <div className="flex items-center gap-2">
            <Users className="size-3 shrink-0" />
            <span>{capacity} seats</span>
          </div>
        )}
      </div>
      {tags && tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
          ))}
        </div>
      )}
    </article>
  );
}
