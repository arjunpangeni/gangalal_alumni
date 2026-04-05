import { JobsClient } from "./JobsClient";
import type { Metadata } from "next";
import { PageShell } from "@/components/layout/Page";
import { PageListingShell } from "@/components/layout/PageListingShell";

export const metadata: Metadata = { title: "Jobs" };
export const dynamic = "force-dynamic";

export default function JobsPage() {
  return (
    <PageListingShell>
      <PageShell className="max-w-4xl">
        <JobsClient />
      </PageShell>
    </PageListingShell>
  );
}
