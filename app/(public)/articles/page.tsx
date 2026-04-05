import { ArticlesClient } from "./ArticlesClient";
import type { Metadata } from "next";
import { PageShell } from "@/components/layout/Page";
import { PageListingShell } from "@/components/layout/PageListingShell";
import { getArticlesListing } from "@/lib/server/public-listings";

export const metadata: Metadata = { title: "Articles" };
export const revalidate = 60;

export default async function ArticlesPage() {
  let initialArticles: unknown[] = [];
  try {
    const { articles } = await getArticlesListing({ page: 1, limit: 50, q: null, tag: null });
    initialArticles = articles;
  } catch {
    /* DB unavailable */
  }

  return (
    <PageListingShell>
      <PageShell className="max-w-6xl">
        <ArticlesClient initialArticles={initialArticles} />
      </PageShell>
    </PageListingShell>
  );
}
