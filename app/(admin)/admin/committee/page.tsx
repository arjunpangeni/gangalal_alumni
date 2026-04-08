import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageShell, PageHeader } from "@/components/layout/Page";
import { AdminCommitteeClient } from "./AdminCommitteeClient";
import { I18nText } from "@/components/i18n/I18nText";

export const unstable_dynamicStaleTime = 30;

export default async function AdminCommitteePage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "superadmin") {
    redirect("/admin/users");
  }

  return (
    <PageShell className="max-w-4xl px-0 space-y-6">
      <PageHeader
        title={<I18nText id="adminPages.committeeTitle" fallback="Committee" />}
        description={
          <I18nText
            id="adminPages.committeeDesc"
            fallback="Add and edit committee members for the About page. Higher number shows first. Upload a photo or paste an image link."
          />
        }
      />
      <AdminCommitteeClient />
    </PageShell>
  );
}
