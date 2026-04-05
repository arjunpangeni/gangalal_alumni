import connectDB from "@/lib/db";
import Event from "@/lib/models/Event";
import { EventCard } from "@/components/cards/EventCard";
import type { Metadata } from "next";
import { Calendar } from "lucide-react";
import { PageShell, PageHeader, PageEmptyState, SectionHeader } from "@/components/layout/Page";

export const metadata: Metadata = { title: "Events" };
export const dynamic = "force-dynamic";

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

export default async function EventsPage() {
  let events: EventDoc[] = [];
  try {
    await connectDB();
    events = (await Event.find({ status: "published", deletedAt: null })
      .sort({ startDate: 1 })
      .limit(20)
      .select("title slug description startDate venue capacity tags")
      .lean()) as unknown as EventDoc[];
  } catch { /* DB unavailable */ }

  const upcoming = events.filter((e) => new Date(e.startDate) >= new Date());
  const past = events.filter((e) => new Date(e.startDate) < new Date());

  return (
    <PageShell className="max-w-6xl">
      <PageHeader title="Events" description="Reunions, workshops, and meetups—in person and online." />
      {upcoming.length > 0 && (
        <section className="mb-10 sm:mb-14">
          <SectionHeader title="Upcoming" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {upcoming.map((e) => <EventCard key={e._id} {...e} />)}
          </div>
        </section>
      )}
      {past.length > 0 && (
        <section>
          <SectionHeader title="Past" className="text-muted-foreground" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {past.map((e) => <EventCard key={e._id} {...e} />)}
          </div>
        </section>
      )}
      {events.length === 0 && (
        <PageEmptyState
          icon={<Calendar className="size-10" />}
          title="No events yet"
          description="Upcoming and past events will appear here."
        />
      )}
    </PageShell>
  );
}
