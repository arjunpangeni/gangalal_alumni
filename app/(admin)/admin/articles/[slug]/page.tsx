import { notFound } from "next/navigation";
import Link from "next/link";
import connectDB from "@/lib/db";
import Article from "@/lib/models/Article";
import { ArticleContent } from "@/components/article/ArticleContent";
import { formatDate } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import { AdminArticleReviewActions } from "./AdminArticleReviewActions";
import { PageShell } from "@/components/layout/Page";
import { ArrowLeft, Calendar, Globe, Lock, Pencil } from "lucide-react";
import type { Metadata } from "next";

export const unstable_dynamicStaleTime = 30;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  await connectDB();
  const doc = await Article.findOne({ slug, deletedAt: null }).select("title status").lean();
  if (!doc) return { title: "Article" };
  return { title: `${String(doc.title ?? slug)} · Admin review` };
}

export default async function AdminArticleReviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectDB();
  const doc = await Article.findOne({ slug, deletedAt: null })
    .populate("authorId", "name email")
    .lean();

  if (!doc) notFound();

  const title = doc.title as string;
  const status = doc.status as string;
  const excerpt = doc.excerpt as string | undefined;
  const coverImage = doc.coverImage as string | undefined;
  const tags = (doc.tags as string[]) ?? [];
  const acl = doc.acl as string;
  const createdAt = doc.createdAt as Date;
  const content = doc.content as Record<string, unknown>;

  const authorRaw = doc.authorId as { name?: string; email?: string } | null;
  const authorName = authorRaw?.name ?? "Unknown author";
  const authorEmail = authorRaw?.email;

  const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    draft: "outline",
    pending: "secondary",
    published: "default",
    archived: "destructive",
  };

  return (
    <PageShell narrow className="space-y-6 pb-16 px-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <Link
          href="/admin/articles"
          className={`${buttonVariants({ variant: "ghost" })} -ml-2 gap-2 text-muted-foreground hover:text-foreground shrink-0`}
        >
          <ArrowLeft className="size-4 shrink-0" />
          All articles
        </Link>
        <AdminArticleReviewActions slug={slug} status={status} />
      </div>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusVariant[status] ?? "outline"} className="capitalize">
            {status}
          </Badge>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            {acl === "member" ? (
              <>
                <Lock className="size-3.5" /> Members only
              </>
            ) : (
              <>
                <Globe className="size-3.5" /> Public
              </>
            )}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-balance">{title}</h1>
        <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1">
          <span>
            <span className="font-medium text-foreground">{authorName}</span>
            {authorEmail ? <span className="hidden sm:inline"> · {authorEmail}</span> : null}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="size-3.5 shrink-0" />
            {formatDate(createdAt)}
          </span>
        </div>
        {authorEmail ? <p className="text-xs text-muted-foreground sm:hidden break-all">{authorEmail}</p> : null}
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </header>

      {coverImage ? (
        <img
          src={coverImage}
          alt=""
          className="w-full rounded-xl border object-cover max-h-80 bg-muted"
        />
      ) : null}

      {excerpt ? <p className="text-muted-foreground text-base leading-relaxed border-l-2 border-primary/30 pl-4">{excerpt}</p> : null}

      <section className="rounded-xl border bg-card shadow-sm">
        <div className="border-b px-4 py-3 sm:px-6">
          <h2 className="text-sm font-medium text-muted-foreground">Article body</h2>
        </div>
        <div className="px-4 py-5 sm:px-6 sm:py-8">
          <ArticleContent content={content} />
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href={`/content/edit/${slug}?returnTo=${encodeURIComponent("/admin/articles")}`}
          className={`${buttonVariants({})} min-h-11 gap-2 justify-center sm:w-auto`}
        >
          <Pencil className="size-4" />
          Edit article
        </Link>
        {status === "published" ? (
          <a
            href={`/articles/${slug}`}
            target="_blank"
            rel="noreferrer"
            className={`${buttonVariants({ variant: "outline" })} min-h-11 justify-center sm:w-auto`}
          >
            Open public page
          </a>
        ) : null}
      </div>
    </PageShell>
  );
}
