import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Article from "@/lib/models/Article";
import { notFound, redirect } from "next/navigation";
import { EditArticleForm } from "./EditArticleForm";
import { PageShell, PageHeader } from "@/components/layout/Page";
import { sanitizeArticleEditorReturnPath } from "@/lib/sanitize-return-path";
import type { Metadata } from "next";

export const unstable_dynamicStaleTime = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Edit article · ${slug}` };
}

export default async function EditArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ returnTo?: string | string[] }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const rawReturn = Array.isArray(sp.returnTo) ? sp.returnTo[0] : sp.returnTo;
  const returnPath = sanitizeArticleEditorReturnPath(rawReturn);
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const article = await Article.findOne({ slug, deletedAt: null }).lean();
  if (!article) notFound();

  const authorId = String(article.authorId);
  const isOwner = authorId === session.user.id;
  const canPublishDirectly =
    session.user.role === "admin" || session.user.role === "superadmin";
  if (!isOwner && !canPublishDirectly) redirect("/dashboard/articles");

  const initial = {
    title: article.title as string,
    content: article.content as object,
    coverImage: article.coverImage as string | undefined,
    tags: (article.tags as string[]) ?? [],
    acl: article.acl as "public" | "member",
    status: article.status as string,
  };

  return (
    <PageShell narrow className="px-0">
      <PageHeader
        title="Edit article"
        description="Update your content, then save or publish."
        className="mb-4 sm:mb-6"
      />
      {canPublishDirectly && initial.status === "pending" ? (
        <p
          role="note"
          className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950 shadow-sm dark:border-amber-700/60 dark:bg-amber-950/50 dark:text-amber-50"
        >
          This submission is <strong className="font-semibold">pending review</strong>. You can fix mistakes here, keep it
          pending, or set Publication to <strong className="font-semibold">Published</strong> when it is ready to go live.
        </p>
      ) : null}
      {!canPublishDirectly && initial.status === "published" ? (
        <p
          role="note"
          className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm leading-relaxed text-amber-950 shadow-sm dark:border-amber-700/60 dark:bg-amber-950/50 dark:text-amber-50"
        >
          This article is <strong className="font-semibold">live</strong>. After you save, it goes back to{" "}
          <strong className="font-semibold">pending review</strong> so an admin can check your changes before they appear
          publicly again.
        </p>
      ) : null}
      <EditArticleForm
        slug={slug}
        initial={initial}
        canPublishDirectly={canPublishDirectly}
        returnPath={returnPath}
      />
    </PageShell>
  );
}
