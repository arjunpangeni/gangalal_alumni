import { notFound } from "next/navigation";
import Link from "next/link";
import connectDB from "@/lib/db";
import Article from "@/lib/models/Article";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, ArrowLeft } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ArticleContent } from "@/components/article/ArticleContent";
import { estimateArticleReadMinutes } from "@/lib/article-read-time";
import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { absoluteContentUrl, getMetadataBase } from "@/lib/site-url";
export const revalidate = 60;

interface ArticleDoc {
  _id: string;
  title: string;
  slug: string;
  content: Record<string, unknown>;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  readTime?: number;
  createdAt: string;
  authorId?: { _id: string; name: string; image?: string };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  await connectDB();
  const article = (await Article.findOne({ slug, status: "published", deletedAt: null })
    .select("title excerpt coverImage createdAt")
    .lean()) as { title?: string; excerpt?: string; coverImage?: string; createdAt?: Date } | null;
  if (!article) return { title: "Article Not Found" };

  const title = article.title ?? "";
  const description = article.excerpt ?? "";
  const imageUrl = absoluteContentUrl(article.coverImage);
  const base = getMetadataBase();
  let pageUrl: string | undefined;
  if (base) {
    try {
      pageUrl = new URL(`/articles/${slug}`, base).href;
    } catch {
      pageUrl = undefined;
    }
  }

  const images = imageUrl
    ? [{ url: imageUrl, alt: title || "Article cover" }]
    : undefined;

  return {
    title,
    description,
    openGraph: {
      type: "article",
      title,
      description,
      url: pageUrl,
      publishedTime: article.createdAt instanceof Date ? article.createdAt.toISOString() : undefined,
      images,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let article: ArticleDoc | null = null;
  try {
    await connectDB();
    article = await Article.findOne({ slug, status: "published", deletedAt: null })
      .populate("authorId", "name image")
      .lean() as unknown as ArticleDoc | null;
  } catch { /* DB unavailable */ }

  if (!article) notFound();

  const readMinutes =
    typeof article.readTime === "number" && article.readTime > 0
      ? article.readTime
      : estimateArticleReadMinutes(article.title, article.content);

  return (
    <article className="mx-auto max-w-[42rem] px-4 py-10 sm:px-6 sm:py-14 lg:py-16">
      <Link
        href="/articles"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6 -ml-2 h-9 gap-1.5 px-2 text-muted-foreground hover:text-foreground")}
      >
        <ArrowLeft className="size-4" aria-hidden />
        All articles
      </Link>

      <header className="text-center sm:text-left">
        {article.tags && article.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap justify-center gap-2 sm:justify-start">
            {article.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="border-border/60 font-medium">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        <h1 className="text-balance text-3xl font-extrabold leading-[1.15] tracking-tight text-foreground sm:text-4xl lg:text-[2.5rem]">
          {article.title}
        </h1>
        <hr className="my-7 border-border/80 sm:my-9" />
        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-2">
          <div className="flex items-center justify-center gap-2 sm:justify-start">
            <Avatar className="size-9 ring-2 ring-border/80 dark:ring-border">
              <AvatarImage src={article.authorId?.image ?? ""} alt="" />
              <AvatarFallback className="text-sm">{article.authorId?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground">{article.authorId?.name}</span>
          </div>
          <span className="hidden h-4 w-px bg-border sm:block" aria-hidden />
          <span className="flex items-center justify-center gap-1.5 sm:justify-start">
            <Calendar className="size-4 shrink-0 opacity-70" aria-hidden />
            <time dateTime={article.createdAt} className="tabular-nums">
              {formatDate(article.createdAt)}
            </time>
          </span>
          <span className="hidden h-4 w-px bg-border sm:block" aria-hidden />
          <span className="flex items-center justify-center gap-1.5 sm:justify-start" title="Estimated reading time">
            <Clock className="size-4 shrink-0 opacity-70" aria-hidden />
            <span className="tabular-nums text-foreground/90">
              {readMinutes} min read
            </span>
          </span>
        </div>
      </header>

      {article.coverImage && (
        <figure className="mt-8 overflow-hidden rounded-2xl border border-border/70 shadow-md sm:mt-10">
          <img
            src={article.coverImage}
            alt=""
            className="max-h-[min(26rem,65vh)] w-full object-cover"
          />
        </figure>
      )}

      <div className={article.coverImage ? "mt-10 sm:mt-12" : "mt-8 sm:mt-10"}>
        <ArticleContent content={article.content} />
      </div>
    </article>
  );
}
