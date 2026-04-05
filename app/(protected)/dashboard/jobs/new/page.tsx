import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { JobEditorForm } from "@/components/jobs/JobEditorForm";
import { PageShell, PageHeader } from "@/components/layout/Page";

export const metadata: Metadata = { title: "Post a job" };

export default async function NewJobPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.status !== "approved") redirect("/auth/pending");

  const canPublishDirectly = session.user.role === "admin" || session.user.role === "superadmin";

  return (
    <PageShell narrow className="px-0">
      <PageHeader
        title="Post a job"
        description={
          canPublishDirectly
            ? "Your listing goes live as soon as you publish."
            : "Submit for review. It stays pending until an admin approves it, then it appears on the public jobs page."
        }
      />
      <JobEditorForm mode="create" canPublishDirectly={canPublishDirectly} />
    </PageShell>
  );
}
