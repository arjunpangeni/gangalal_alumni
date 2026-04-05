import { ArticlesClient } from "./ArticlesClient";
import type { Metadata } from "next";
import { PageShell, PageHeader } from "@/components/layout/Page";

export const metadata: Metadata = { title: "Articles" };
export const dynamic = "force-dynamic";

export default function ArticlesPage() {
  return (
    <PageShell className="max-w-6xl">
      <PageHeader
        title="Articles"
        description="Stories, guides, and updates from verified members—readable on any device."
      />
      <ArticlesClient />
    </PageShell>
  );
}
