import connectDB from "@/lib/db";
import Notice from "@/lib/models/Notice";
import { PageShell, PageHeader } from "@/components/layout/Page";
import { AdminNoticesClient, type AdminNoticeRow } from "./AdminNoticesClient";

export default async function AdminNoticesPage() {
  await connectDB();
  const raw = await Notice.find({ deletedAt: null })
    .sort({ sortOrder: -1, createdAt: -1 })
    .limit(100)
    .select("title body linkUrl linkLabel isActive sortOrder expiresAt")
    .lean();

  const initial: AdminNoticeRow[] = raw.map((n) => ({
    _id: String(n._id),
    title: n.title as string,
    body: n.body as string,
    linkUrl: n.linkUrl as string | undefined,
    linkLabel: n.linkLabel as string | undefined,
    isActive: !!n.isActive,
    sortOrder: (n.sortOrder as number) ?? 0,
    expiresAt: n.expiresAt ? (n.expiresAt as Date).toISOString() : null,
  }));

  return (
    <PageShell className="max-w-4xl px-0 space-y-6">
      <PageHeader
        title="Notices"
        description={
          <>
            Short announcements shown on the <strong className="text-foreground font-medium">homepage</strong> directly under the hero (active
            items only). Higher sort order appears first.
          </>
        }
      />
      <AdminNoticesClient initial={initial} />
    </PageShell>
  );
}
