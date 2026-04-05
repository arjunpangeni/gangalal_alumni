import { NewArticleForm } from "./NewArticleForm";
import { PageShell, PageHeader } from "@/components/layout/Page";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Write Article" };

export default function NewArticlePage() {
  return (
    <PageShell narrow className="px-0">
      <PageHeader title="Write new article" description="Share useful updates with the community." className="mb-4 sm:mb-6" />
      <NewArticleForm />
    </PageShell>
  );
}
