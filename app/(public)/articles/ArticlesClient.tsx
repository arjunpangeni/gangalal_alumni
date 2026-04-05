"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ArticleCard } from "@/components/cards/ArticleCard";
import { Input } from "@/components/ui/input";
import { Search, Loader2, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { PageEmptyState } from "@/components/layout/Page";
import { FileText } from "lucide-react";

interface Article {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  readTime?: number;
  createdAt: string;
  authorId?: { name: string; image?: string };
}

export function ArticlesClient({ initialArticles }: { initialArticles: unknown[] }) {
  const [articles, setArticles] = useState<Article[]>(initialArticles as Article[]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const hasHydratedRef = useRef(false);

  const fetchArticles = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (q) params.set("q", q);
      const res = await fetch(`/api/articles?${params}`);
      const json = await res.json();
      if (json.success) {
        setArticles(json.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      if (!debouncedSearch.trim() && initialArticles.length > 0) return;
    }
    void fetchArticles(debouncedSearch);
  }, [debouncedSearch, fetchArticles, initialArticles.length]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 border-b border-border/50 pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pb-5 lg:pb-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl">Articles</h1>
          <p className="mt-0.5 truncate text-xs leading-snug text-muted-foreground sm:text-sm">
            Articles and opinions by verified members.
            {(!loading || articles.length > 0) && (
              <span className="text-muted-foreground/80">
                {" "}
                · <span className="tabular-nums text-foreground/90">{articles.length}</span>{" "}
                {articles.length === 1 ? "article" : "articles"}
              </span>
            )}
          </p>
        </div>
        <div className="relative w-full shrink-0 sm:max-w-[13.5rem]">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/75"
            aria-hidden
          />
          <Input
            placeholder="Title, tags, or author name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 rounded-lg border-border/60 bg-background/90 py-2 pl-8 pr-16 text-sm shadow-sm transition-surface dark:bg-background/50"
            aria-label="Search articles"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-8 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-surface hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
          {loading && debouncedSearch.trim() ? (
            <Loader2
              className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-primary"
              aria-hidden
            />
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {articles.map((a) => (
          <ArticleCard
            key={String(a._id)}
            title={a.title}
            slug={a.slug}
            excerpt={a.excerpt}
            coverImage={a.coverImage}
            tags={a.tags}
            readTime={a.readTime}
            authorName={a.authorId?.name}
            authorImage={a.authorId?.image}
            createdAt={a.createdAt}
          />
        ))}
        {articles.length === 0 && !loading && (
          <div className="col-span-full">
            <PageEmptyState
              icon={<FileText className="size-10" />}
              title="No articles yet"
              description="New articles will appear here."
            />
          </div>
        )}
      </div>
    </div>
  );
}