import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Job from "@/lib/models/Job";
import { notFound, redirect } from "next/navigation";
import { JobEditorForm } from "@/components/jobs/JobEditorForm";
import { PageShell, PageHeader } from "@/components/layout/Page";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Edit job · ${slug}` };
}

export default async function EditJobPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.status !== "approved") redirect("/auth/pending");

  await connectDB();
  const job = await Job.findOne({ slug, deletedAt: null }).lean();
  if (!job) notFound();

  const authorId = String(job.authorId);
  const isOwner = authorId === session.user.id;
  const canPublishDirectly = session.user.role === "admin" || session.user.role === "superadmin";
  if (!isOwner && !canPublishDirectly) redirect("/dashboard/jobs");

  return (
    <PageShell narrow className="px-0">
      <PageHeader
        title="Edit job listing"
        description="Update details and save. Only you and admins can edit this post."
        className="mb-4 sm:mb-6"
      />
      {canPublishDirectly && (job.status as string) === "pending" ? (
        <p
          role="note"
          className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950 shadow-sm dark:border-amber-700/60 dark:bg-amber-950/50 dark:text-amber-50"
        >
          This listing is <strong className="font-semibold">pending review</strong>. Edit as needed, keep it pending, or set
          Publication to <strong className="font-semibold">Published</strong> when it should go live.
        </p>
      ) : null}
      <JobEditorForm
        mode="edit"
        slug={slug}
        canPublishDirectly={canPublishDirectly}
        initial={{
          title: job.title as string,
          description: job.description as string,
          company: job.company as string,
          location: job.location as string,
          type: job.type as string,
          salary: (job.salary as string | undefined) ?? "",
          educationOrSkills: (job as { educationOrSkills?: string }).educationOrSkills ?? "",
          applyUrl: (job.applyUrl as string) ?? "",
          applyEmail: (job as { applyEmail?: string }).applyEmail ?? "",
          applyPhone: (job as { applyPhone?: string }).applyPhone ?? "",
          expiresAt: job.expiresAt as Date | undefined,
          tags: (job.tags as string[]) ?? [],
          acl: job.acl as "public" | "member",
          status: job.status as string,
        }}
      />
    </PageShell>
  );
}
