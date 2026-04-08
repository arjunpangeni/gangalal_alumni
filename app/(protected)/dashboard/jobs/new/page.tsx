import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { JobEditorForm } from "@/components/jobs/JobEditorForm";
import { PageShell, PageHeader } from "@/components/layout/Page";
import { I18nText } from "@/components/i18n/I18nText";

export const metadata: Metadata = { title: "Post a job" };

export const unstable_dynamicStaleTime = 30;

export default async function NewJobPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.status !== "approved") redirect("/pending");

  const canPublishDirectly = session.user.role === "admin" || session.user.role === "superadmin";

  return (
    <PageShell narrow className="px-0">
      <PageHeader
        title={<I18nText id="dashboard.postAJob" fallback="Post a job" />}
        description={
          canPublishDirectly
            ? <I18nText id="dashboard.jobPublishDirect" fallback="Your listing goes live as soon as you publish." />
            : <I18nText id="dashboard.jobPublishReview" fallback="Submit for review. It stays pending until an admin approves it, then it appears on the public jobs page." />
        }
      />
      <JobEditorForm mode="create" canPublishDirectly={canPublishDirectly} />
    </PageShell>
  );
}
