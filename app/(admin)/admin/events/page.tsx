import connectDB from "@/lib/db";
import Event from "@/lib/models/Event";
import { purgeExpiredEvents } from "@/lib/server/purge-expired-events";
import { PageShell, PageHeader, SectionHeader, PageEmptyState } from "@/components/layout/Page";
import { AdminEventsClient } from "./AdminEventsClient";
import { formatDate } from "@/lib/utils";
import { Calendar } from "lucide-react";
import { I18nText } from "@/components/i18n/I18nText";

export const unstable_dynamicStaleTime = 30;

export default async function AdminEventsPage() {
  await connectDB();
  await purgeExpiredEvents();

  const events = await Event.find({ deletedAt: null })
    .sort({ startDate: 1 })
    .limit(50)
    .select("title slug startDate venue capacity status")
    .lean();

  return (
    <PageShell className="max-w-5xl px-0 space-y-10">
      <PageHeader
        title={<I18nText id="adminPages.eventsTitle" fallback="Events" />}
        description={<I18nText id="adminPages.eventsDesc" fallback="Add or edit published events. They appear on the public /events page and in the homepage Upcoming Events section." />}
      />

      <AdminEventsClient />

      <div>
        <SectionHeader title={<I18nText id="adminPages.recentEvents" fallback="Recent events" />} className="mb-4" />
        <div className="-mx-1 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium"><I18nText id="adminPages.tableTitle" fallback="Title" /></th>
                <th className="px-4 py-3 text-left font-medium hidden lg:table-cell"><I18nText id="adminPages.tableVenue" fallback="Venue" /></th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell"><I18nText id="adminPages.tableStart" fallback="Start" /></th>
                <th className="px-4 py-3 text-left font-medium"><I18nText id="adminPages.tableStatus" fallback="Status" /></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {events.map((event) => (
                <tr key={String(event._id)} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium">
                    <span className="line-clamp-2">{event.title as string}</span>
                    <span className="block text-xs text-muted-foreground md:hidden mt-1">
                      {event.startDate ? formatDate(event.startDate as Date) : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{String(event.venue ?? "—")}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {event.startDate ? formatDate(event.startDate as Date) : "—"}
                  </td>
                  <td className="px-4 py-3 capitalize">{event.status as string}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {events.length === 0 ? (
          <PageEmptyState
            className="mt-4 border-0 bg-transparent py-10"
            icon={<Calendar className="size-10" />}
            title={<I18nText id="adminPages.noEventsYet" fallback="No events yet" />}
            description={<I18nText id="adminPages.createOneAbove" fallback="Create one with the form above." />}
          />
        ) : null}
      </div>
    </PageShell>
  );
}
