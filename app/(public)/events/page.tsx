import type { Metadata } from "next";
import { PageShell } from "@/components/layout/Page";
import { PageListingShell } from "@/components/layout/PageListingShell";
import { EventsClient } from "./EventsClient";
import { getEventsListing } from "@/lib/server/public-listings";

export const metadata: Metadata = { title: "Events" };
export const revalidate = 60;

export default async function EventsPage() {
  let initialEvents: unknown[] = [];
  try {
    const { events } = await getEventsListing({ page: 1, limit: 80, q: null });
    initialEvents = events;
  } catch {
    /* DB unavailable */
  }

  return (
    <PageListingShell>
      <PageShell className="max-w-6xl">
        <EventsClient initialEvents={initialEvents} />
      </PageShell>
    </PageListingShell>
  );
}
