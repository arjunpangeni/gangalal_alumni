"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { EventCard } from "@/components/cards/EventCard";
import { Input } from "@/components/ui/input";
import { Search, Loader2, X, Calendar } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { PageEmptyState } from "@/components/layout/Page";

interface EventDoc {
  _id: string;
  title: string;
  slug: string;
  description: string;
  startDate: string;
  venue: string;
  capacity?: number;
  tags?: string[];
}

export function EventsClient() {
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(search, 300);

  const fetchEvents = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "80" });
      if (q) params.set("q", q);
      const res = await fetch(`/api/events?${params}`);
      const json = await res.json();
      if (json.success) {
        setEvents(json.data as EventDoc[]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(debouncedSearch);
  }, [debouncedSearch, fetchEvents]);

  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const up: EventDoc[] = [];
    const pa: EventDoc[] = [];
    for (const e of events) {
      if (new Date(e.startDate) >= now) up.push(e);
      else pa.push(e);
    }
    return { upcoming: up, past: pa };
  }, [events]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 border-b border-border/50 pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pb-5 lg:pb-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl">Events</h1>
          <p className="mt-0.5 truncate text-xs leading-snug text-muted-foreground sm:text-sm">
            Reunions, workshops, and meetups—in person and online.
            {(!loading || events.length > 0) && (
              <span className="text-muted-foreground/80">
                {" "}
                · <span className="tabular-nums text-foreground/90">{events.length}</span>{" "}
                {events.length === 1 ? "event" : "events"}
              </span>
            )}
          </p>
        </div>
        <div className="relative w-full shrink-0 sm:max-w-[13.5rem]">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/75"
            aria-hidden
          />
          <Input
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 rounded-lg border-border/60 bg-background/90 py-2 pl-8 pr-16 text-sm shadow-sm transition-surface dark:bg-background/50"
            aria-label="Search events"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-8 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-surface hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
          {loading && debouncedSearch.trim() ? (
            <Loader2
              className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-primary"
              aria-hidden
            />
          ) : null}
        </div>
      </div>

      {upcoming.length > 0 && (
        <section className="space-y-4 sm:space-y-5">
          <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl">Upcoming</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {upcoming.map((e) => (
              <EventCard key={e._id} {...e} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="space-y-4 sm:space-y-5">
          <h2 className="font-heading text-lg font-semibold tracking-tight text-muted-foreground sm:text-xl">Past</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {past.map((e) => (
              <EventCard key={e._id} {...e} />
            ))}
          </div>
        </section>
      )}

      {events.length === 0 && !loading && (
        <PageEmptyState
          icon={<Calendar className="size-10" />}
          title="No events match your search"
          description="Try another keyword, or check back later for new listings."
        />
      )}
    </div>
  );
}
