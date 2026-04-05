import { JobsClient } from "./JobsClient";
import type { Metadata } from "next";
import { PageShell } from "@/components/layout/Page";
import { PageListingShell } from "@/components/layout/PageListingShell";
import { getJobsListing } from "@/lib/server/public-listings";

export const metadata: Metadata = { title: "Jobs" };
export const revalidate = 60;

export default async function JobsPage() {
  let initialJobs: unknown[] = [];
  try {
    const { jobs } = await getJobsListing({ page: 1, limit: 50, q: null, type: null });
    initialJobs = jobs;
  } catch {
    /* DB unavailable */
  }

  return (
    <PageListingShell>
      <PageShell className="max-w-4xl">
        <JobsClient initialJobs={initialJobs} />
      </PageShell>
    </PageListingShell>
  );
}
