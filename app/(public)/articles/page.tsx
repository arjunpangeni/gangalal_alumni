import { ArticlesClient } from "./ArticlesClient";
import type { Metadata } from "next";
import { PageShell } from "@/components/layout/Page";
import { PageListingShell } from "@/components/layout/PageListingShell";

export const metadata: Metadata = { title: "Articles" };
export const dynamic = "force-dynamic";

export default function ArticlesPage() {
  return (
    <PageListingShell>
      <PageShell className="max-w-6xl">
        <ArticlesClient />
      </PageShell>
    </PageListingShell>
  );
}
