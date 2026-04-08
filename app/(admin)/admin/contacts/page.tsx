import { PageShell, PageHeader } from "@/components/layout/Page";
import { AdminContactsClient } from "./AdminContactsClient";
import { I18nText } from "@/components/i18n/I18nText";

export const unstable_dynamicStaleTime = 30;

export default function AdminContactsPage() {
  return (
    <PageShell className="max-w-4xl px-0 space-y-6">
      <PageHeader
        title={<I18nText id="adminPages.contactsTitle" fallback="Contact messages" />}
        description={
          <I18nText
            id="adminPages.contactsDesc"
            fallback="Submissions from the public contact form. Mark as pending or resolved, or delete when no longer needed."
          />
        }
      />
      <AdminContactsClient />
    </PageShell>
  );
}
