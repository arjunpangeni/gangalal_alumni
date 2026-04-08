"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  FilePenLine,
  Calendar,
  User,
  Globe,
  Lock,
  ListFilter,
  ExternalLink,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useI18n } from "@/components/i18n/I18nProvider";

const ADMIN_ARTICLES_RETURN = "/admin/articles";
const editArticleHref = (slug: string) =>
  `/content/edit/${slug}?returnTo=${encodeURIComponent(ADMIN_ARTICLES_RETURN)}`;

export interface AdminArticleRow {
  _id: string;
  title: string;
  slug: string;
  status: string;
  createdAt: string;
  excerpt?: string;
  acl?: string;
  authorId?: { name?: string; email?: string };
}

const FILTERS = [
  { id: "all" },
  { id: "pending" },
  { id: "published" },
  { id: "draft" },
  { id: "archived" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  pending: "secondary",
  published: "default",
  archived: "destructive",
};

function IconAction({
  href,
  external,
  label,
  className,
  children,
}: {
  href: string;
  external?: boolean;
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const base = cn(
    buttonVariants({ variant: "outline", size: "icon-sm" }),
    "touch-manipulation text-foreground",
    className
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={base} title={label} aria-label={label}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={base} title={label} aria-label={label}>
      {children}
    </Link>
  );
}

export function AdminArticlesClient({ initialArticles }: { initialArticles: AdminArticleRow[] }) {
  const { messages } = useI18n();
  const [articles, setArticles] = useState<AdminArticleRow[]>(initialArticles);
  const [filter, setFilter] = useState<FilterId>("all");
  const [deleteSlug, setDeleteSlug] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return articles;
    return articles.filter((a) => a.status === filter);
  }, [articles, filter]);

  const counts = useMemo(() => {
    const c = { all: articles.length, pending: 0, published: 0, draft: 0, archived: 0 };
    for (const a of articles) {
      if (a.status === "pending") c.pending++;
      else if (a.status === "published") c.published++;
      else if (a.status === "draft") c.draft++;
      else if (a.status === "archived") c.archived++;
    }
    return c as Record<FilterId, number>;
  }, [articles]);

  async function performAction(slug: string, action: "approve" | "reject") {
    if (action === "reject") {
      const note = window.prompt(messages.adminClients.rejectListingDesc)?.trim();
      if (note === undefined) return;
      if (note.length > 0 && note.length < 10) {
        toast.error(messages.adminClients.noteMin10OrEmpty);
        return;
      }
      const body: { action: string; reason?: string } = { action: "reject" };
      if (note.length > 0) body.reason = note;
      const res = await fetch(`/api/articles/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setArticles((prev) => prev.map((a) => (a.slug === slug ? { ...a, status: json.data?.status ?? "archived" } : a)));
        toast.success(messages.adminClients.articleRejectedArchived);
      } else {
        toast.error(json.error ?? messages.adminClients.failed);
      }
      return;
    }

    const res = await fetch(`/api/articles/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    const json = await res.json();
    if (json.success) {
      setArticles((prev) => prev.map((a) => (a.slug === slug ? { ...a, status: json.data?.status ?? a.status } : a)));
      toast.success(messages.adminClients.articlePublished);
    } else {
      toast.error(json.error ?? messages.adminClients.failed);
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <ListFilter className="size-4 shrink-0 opacity-70" aria-hidden />
        <span>
          <span className="font-medium text-foreground">{counts.all}</span> {messages.nav.articles}
        </span>
        <span className="text-border">·</span>
        <span className="font-medium text-amber-700 dark:text-amber-400">{counts.pending} {messages.adminClients.pending}</span>
      </div>

      <div
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 sm:flex-wrap sm:overflow-visible"
        role="tablist"
        aria-label={messages.adminClients.filterByStatus}
      >
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "min-h-9 shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
              filter === f.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted/70 hover:text-foreground"
            )}
          >
            {messages.adminClients[f.id]}
            <span className="ml-1 tabular-nums opacity-80">({counts[f.id]})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-border/80 bg-muted/20 py-14 text-center text-sm text-muted-foreground">
          {messages.adminClients.noArticlesInView}
        </div>
      ) : (
        <ul className="mx-auto flex max-w-xl list-none flex-col gap-2.5 p-0 sm:gap-3">
          {filtered.map((a) => {
            const pending = a.status === "pending";
            const published = a.status === "published";
            return (
              <li
                key={a._id}
                className={cn(
                  "rounded-2xl border bg-card p-3.5 shadow-sm ring-1 ring-border/50 sm:p-4",
                  pending && "border-amber-500/30 bg-amber-500/[0.04] ring-amber-500/15 dark:bg-amber-500/[0.07]"
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant={statusVariant[a.status] ?? "outline"} className="h-5 shrink-0 px-1.5 text-[10px] capitalize">
                        {a.status}
                      </Badge>
                    <span className="text-muted-foreground" title={a.acl === "member" ? messages.adminClients.membersOnly : messages.adminClients.public}>
                        {a.acl === "member" ? (
                          <Lock className="size-3.5" aria-label={messages.adminClients.membersOnly} />
                        ) : (
                          <Globe className="size-3.5" aria-label={messages.adminClients.public} />
                        )}
                      </span>
                    </div>
                    <h2 className="line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-foreground sm:line-clamp-1 sm:text-[0.9375rem]">
                      {a.title}
                    </h2>
                    {a.excerpt ? (
                      <p className="line-clamp-1 text-xs leading-relaxed text-muted-foreground">{a.excerpt}</p>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span className="inline-flex min-w-0 max-w-full items-center gap-1">
                        <User className="size-3 shrink-0 opacity-70" aria-hidden />
                        <span className="truncate">{a.authorId?.name ?? "—"}</span>
                      </span>
                      <span className="text-border">·</span>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <Calendar className="size-3 shrink-0 opacity-70" aria-hidden />
                        <time dateTime={a.createdAt}>{formatDate(a.createdAt)}</time>
                      </span>
                    </div>
                  </div>

                  <div
                    className="flex flex-wrap items-center justify-end gap-1 border-t border-border/60 pt-2.5 sm:w-auto sm:shrink-0 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0"
                    role="toolbar"
                    aria-label={`${messages.adminClients.actionsFor} ${a.title}`}
                  >
                    <IconAction href={`/admin/articles/${a.slug}`} label={messages.adminClients.reviewArticle}>
                      <Eye className="size-4" aria-hidden />
                    </IconAction>
                    <IconAction href={editArticleHref(a.slug)} label={messages.adminClients.editArticle}>
                      <FilePenLine className="size-4" aria-hidden />
                    </IconAction>
                    {published ? (
                      <IconAction href={`/articles/${a.slug}`} external label={messages.adminClients.openPublicPage}>
                        <ExternalLink className="size-4" aria-hidden />
                      </IconAction>
                    ) : null}
                    {pending ? (
                      <>
                        <Button
                          type="button"
                          size="icon-sm"
                          className="touch-manipulation border-emerald-600/30 bg-emerald-600 text-white hover:bg-emerald-700"
                          title={messages.adminClients.approvePublish}
                          aria-label={messages.adminClients.approvePublish}
                          onClick={() => void performAction(a.slug, "approve")}
                        >
                          <CheckCircle className="size-4" aria-hidden />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          className="touch-manipulation border-destructive/40 text-destructive hover:bg-destructive/10"
                          title={messages.adminClients.rejectArticle}
                          aria-label={messages.adminClients.rejectArticle}
                          onClick={() => void performAction(a.slug, "reject")}
                        >
                          <XCircle className="size-4" aria-hidden />
                        </Button>
                      </>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="touch-manipulation text-destructive hover:bg-destructive/10 hover:text-destructive"
                      title={messages.adminClients.deleteArticle}
                      aria-label={messages.adminClients.deleteArticle}
                      onClick={() => setDeleteSlug(a.slug)}
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={deleteSlug !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteSlug(null);
        }}
        title={messages.adminClients.deleteThisArticle}
        description={messages.adminClients.deleteArticleDesc}
        confirmLabel={messages.dashboard.delete}
        cancelLabel={messages.dashboard.cancel}
        variant="destructive"
        onConfirm={async () => {
          if (!deleteSlug) return;
          const slug = deleteSlug;
          const res = await fetch(`/api/articles/${slug}`, { method: "DELETE" });
          const json = await res.json();
          if (!json.success) {
            toast.error(json.error ?? messages.adminClients.failed);
            throw new Error("delete failed");
          }
          setArticles((prev) => prev.filter((a) => a.slug !== slug));
          toast.success(messages.dashboard.articleDeleted);
        }}
      />
    </div>
  );
}
