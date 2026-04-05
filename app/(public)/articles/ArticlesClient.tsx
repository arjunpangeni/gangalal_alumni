"use client";

import { useState, useEffect, useCallback } from "react";
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

export function ArticlesClient() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(search, 300);

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
    fetchArticles(debouncedSearch);
  }, [debouncedSearch, fetchArticles]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-b from-card to-card/80 shadow-md ring-1 ring-border/30 dark:from-card/90 dark:to-card/60 dark:ring-border/40">
        <div className="border-b border-border/50 bg-muted/30 px-4 py-3 dark:bg-muted/20 sm:px-5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Search className="size-3.5 text-primary" aria-hidden />
            Search articles
          </div>
        </div>

        <div className="p-6 sm:p-7">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/80"
              aria-hidden
            />
            <Input
              placeholder="Article title, content, or tags…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 rounded-2xl border-border/70 bg-background/90 pl-12 pr-24 text-base shadow-inner dark:bg-background/50"
              aria-label="Search articles"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            ) : null}
            {loading && debouncedSearch.trim() ? (
              <Loader2 className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 animate-spin text-primary sm:right-12" aria-hidden />
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing <span className="font-semibold tabular-nums text-foreground">{articles.length}</span> articles
        </span>
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