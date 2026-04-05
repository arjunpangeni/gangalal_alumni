import { JobsClient } from "./JobsClient";
import type { Metadata } from "next";
import { PageShell, PageHeader } from "@/components/layout/Page";

export const metadata: Metadata = { title: "Jobs" };
export const dynamic = "force-dynamic";

export default function JobsPage() {
  return (
    <PageShell className="max-w-4xl">
      <PageHeader title="Job opportunities" description="Roles and openings shared within the alumni network." />
      <JobsClient />
    </PageShell>
  );
}
