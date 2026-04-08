import connectDB from "@/lib/db";
import Notice from "@/lib/models/Notice";
import { PageShell, PageHeader } from "@/components/layout/Page";
import { AdminNoticesClient, type AdminNoticeRow } from "./AdminNoticesClient";
import { I18nText } from "@/components/i18n/I18nText";

export const unstable_dynamicStaleTime = 30;

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
        title={<I18nText id="adminPages.noticesTitle" fallback="Notices" />}
        description={<I18nText id="adminPages.noticesDesc" fallback="Short announcements shown on the homepage under the hero. Higher sort order appears first." />}
      />
      <AdminNoticesClient initial={initial} />
    </PageShell>
  );
}
