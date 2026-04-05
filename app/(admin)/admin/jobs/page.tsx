import connectDB from "@/lib/db";
import Job from "@/lib/models/Job";
import { PageShell, PageHeader } from "@/components/layout/Page";
import { AdminJobsClient, type AdminJobRow } from "./AdminJobsClient";

export default async function AdminJobsPage() {
  await connectDB();

  const raw = await Job.find({ deletedAt: null })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("authorId", "name email")
    .select("title slug company location type status createdAt authorId")
    .lean();

  const initialJobs: AdminJobRow[] = raw.map((j) => ({
    _id: String(j._id),
    title: j.title as string,
    slug: j.slug as string,
    company: j.company as string,
    location: j.location as string,
    type: j.type as string,
    status: j.status as string,
    createdAt: (j.createdAt as Date).toISOString(),
    authorId: j.authorId
      ? {
          name: (j.authorId as { name?: string }).name,
          email: (j.authorId as { email?: string }).email,
        }
      : undefined,
  }));

  return (
    <PageShell className="max-w-4xl space-y-6 px-0">
      <PageHeader
        title="Job moderation"
        description="Approve member-submitted listings or edit any post from the member dashboard. Published jobs appear on the public jobs page."
      />
      <AdminJobsClient initialJobs={initialJobs} />
    </PageShell>
  );
}
