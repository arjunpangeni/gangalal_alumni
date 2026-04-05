import type { Metadata } from "next";
import { PageShell } from "@/components/layout/Page";
import { PageListingShell } from "@/components/layout/PageListingShell";
import { EventsClient } from "./EventsClient";

export const metadata: Metadata = { title: "Events" };
export const dynamic = "force-dynamic";

export default function EventsPage() {
  return (
    <PageListingShell>
      <PageShell className="max-w-6xl">
        <EventsClient />
      </PageShell>
    </PageListingShell>
  );
}
