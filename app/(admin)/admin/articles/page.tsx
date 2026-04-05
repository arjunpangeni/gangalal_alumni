import connectDB from "@/lib/db";
import Article from "@/lib/models/Article";
import { PageShell, PageHeader } from "@/components/layout/Page";
import { AdminArticlesClient, type AdminArticleRow } from "./AdminArticlesClient";

export default async function AdminArticlesPage() {
  await connectDB();
  const raw = await Article.find({ deletedAt: null })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("authorId", "name email")
    .select("title slug status createdAt authorId excerpt acl")
    .lean();

  const initialArticles: AdminArticleRow[] = raw.map((a) => ({
    _id: String(a._id),
    title: a.title as string,
    slug: a.slug as string,
    status: a.status as string,
    createdAt: (a.createdAt as Date).toISOString(),
    excerpt: (a.excerpt as string | undefined) ?? undefined,
    acl: (a.acl as string | undefined) ?? "public",
    authorId: a.authorId
      ? {
          name: (a.authorId as { name?: string }).name,
          email: (a.authorId as { email?: string }).email,
        }
      : undefined,
  }));

  return (
    <PageShell className="max-w-3xl space-y-6">
      <PageHeader
        title="Article moderation"
        description="Review pending submissions, read the full draft, fix issues in the editor, then approve or reject. Member posts need admin or superadmin approval before they appear on the site."
      />
      <AdminArticlesClient initialArticles={initialArticles} />
    </PageShell>
  );
}
