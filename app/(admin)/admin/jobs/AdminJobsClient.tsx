"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Calendar,
  Building2,
  MapPin,
  Eye,
  FilePenLine,
  Briefcase,
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { PageEmptyState } from "@/components/layout/Page";
import { buttonVariants } from "@/components/ui/button-variants";

export interface AdminJobRow {
  _id: string;
  title: string;
  slug: string;
  company: string;
  location: string;
  type: string;
  status: string;
  createdAt: string;
  authorId?: { name?: string; email?: string };
}

const FILTERS = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "published", label: "Published" },
  { id: "draft", label: "Draft" },
  { id: "archived", label: "Archived" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

function parseJsonBody(text: string): { success?: boolean; error?: string; message?: string } {
  try {
    return JSON.parse(text) as { success?: boolean; error?: string; message?: string };
  } catch {
    return {};
  }
}

export function AdminJobsClient({ initialJobs }: { initialJobs: AdminJobRow[] }) {
  const router = useRouter();
  const [jobs, setJobs] = useState<AdminJobRow[]>(initialJobs);
  const [filter, setFilter] = useState<FilterId>(() => {
    const pending = initialJobs.filter((j) => j.status === "pending").length;
    return pending > 0 ? "pending" : "all";
  });
  const [rejectSlug, setRejectSlug] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  const filtered = useMemo(() => {
    if (filter === "all") return jobs;
    return jobs.filter((j) => j.status === filter);
  }, [jobs, filter]);

  const counts = useMemo(() => {
    const c = { all: jobs.length, pending: 0, published: 0, draft: 0, archived: 0 };
    for (const j of jobs) {
      if (j.status === "pending") c.pending++;
      else if (j.status === "published") c.published++;
      else if (j.status === "draft") c.draft++;
      else if (j.status === "archived") c.archived++;
    }
    return c as Record<FilterId, number>;
  }, [jobs]);

  async function approve(slug: string) {
    const res = await fetch(`/api/jobs/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    const text = await res.text();
    const json = parseJsonBody(text);
    if (!res.ok) {
      const msg = (json.error ?? json.message ?? text.slice(0, 200)) || `HTTP ${res.status}`;
      toast.error(`${res.status}: ${msg}`);
      return;
    }
    if (json.success) {
      setJobs((prev) => prev.map((j) => (j.slug === slug ? { ...j, status: "published" } : j)));
      toast.success("Job published.");
      router.refresh();
    } else {
      toast.error(json.error ?? "Failed.");
    }
  }

  function openReject(slug: string) {
    setRejectSlug(slug);
    setRejectNote("");
  }

  async function confirmReject() {
    if (!rejectSlug) return;
    const note = rejectNote.trim();
    if (note.length > 0 && note.length < 10) {
      toast.error("Note must be at least 10 characters or leave empty.");
      return;
    }
    setRejectSubmitting(true);
    try {
      const body: { action: string; reason?: string } = { action: "reject" };
      if (note.length > 0) body.reason = note;
      const res = await fetch(`/api/jobs/${rejectSlug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      const json = parseJsonBody(text);
      if (!res.ok) {
        const msg = (json.error ?? json.message ?? text.slice(0, 200)) || `HTTP ${res.status}`;
        toast.error(`${res.status}: ${msg}`);
        return;
      }
      if (json.success) {
        const slug = rejectSlug;
        setJobs((prev) => prev.map((j) => (j.slug === slug ? { ...j, status: "archived" } : j)));
        toast.success("Listing rejected.");
        setRejectSlug(null);
        setRejectNote("");
        router.refresh();
      } else {
        toast.error(json.error ?? "Failed.");
      }
    } finally {
      setRejectSubmitting(false);
    }
  }

  const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    draft: "outline",
    pending: "secondary",
    published: "default",
    archived: "destructive",
  };

  return (
    <div className="space-y-6">
      {counts.pending > 0 ? (
        <div
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100"
          role="status"
        >
          <span className="font-medium">Action required:</span>{" "}
          {counts.pending} listing{counts.pending === 1 ? "" : "s"} waiting for review.
        </div>
      ) : null}

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{counts.all}</span>
        <span>listings ·</span>
        <span className="text-amber-700 dark:text-amber-400 font-medium">{counts.pending} pending</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible" role="tablist">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors min-h-11 touch-manipulation",
              filter === f.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted/60"
            )}
          >
            {f.label}
            <span className="ml-1.5 tabular-nums opacity-80">({counts[f.id]})</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <PageEmptyState
          icon={<Briefcase className="size-10" />}
          title="No listings in this view"
          description="Try another filter or wait for new submissions."
        />
      ) : (
        <ul className="grid gap-3 sm:gap-4 list-none p-0 m-0">
          {filtered.map((j) => (
            <li key={j._id} className="rounded-xl border bg-card shadow-sm p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant[j.status] ?? "outline"} className="capitalize">
                  {j.status}
                </Badge>
                <Badge variant="outline" className="font-normal">
                  {j.type.replace("-", " ")}
                </Badge>
              </div>
              <div>
                <h2 className="font-semibold text-lg">{j.title}</h2>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="size-3.5 shrink-0" />
                    {j.company}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5 shrink-0" />
                    {j.location}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="size-3.5 shrink-0" />
                    {formatDate(j.createdAt)}
                  </span>
                </div>
                {j.authorId?.name ? (
                  <p className="text-xs text-muted-foreground mt-2">Posted by {j.authorId.name}</p>
                ) : null}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap pt-2 border-t">
                <Link
                  href={`/jobs#${j.slug}`}
                  className={`${buttonVariants({ variant: "secondary", size: "lg" })} w-full sm:w-auto gap-2 justify-center min-h-11`}
                >
                  <Eye className="size-4" />
                  View on site
                </Link>
                <Link
                  href={`/dashboard/jobs/edit/${j.slug}`}
                  className={`${buttonVariants({ variant: "outline", size: "lg" })} w-full sm:w-auto gap-2 justify-center min-h-11`}
                >
                  <FilePenLine className="size-4" />
                  Edit
                </Link>
                {j.status === "pending" ? (
                  <>
                    <Button
                      type="button"
                      size="lg"
                      className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white min-h-11 w-full sm:w-auto"
                      onClick={() => void approve(j.slug)}
                    >
                      <CheckCircle className="size-4" />
                      Approve
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="gap-1 border-destructive/40 text-destructive min-h-11 w-full sm:w-auto"
                      onClick={() => openReject(j.slug)}
                    >
                      <XCircle className="size-4" />
                      Reject
                    </Button>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog
        open={rejectSlug !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRejectSlug(null);
            setRejectNote("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Reject listing</DialogTitle>
            <DialogDescription>
              Optional note for the author (at least 10 characters if you add one). Leave blank to reject without a
              note.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            placeholder="Reason (optional)…"
            rows={4}
            className="min-h-24"
            disabled={rejectSubmitting}
          />
          <DialogFooter className="sm:justify-end gap-2 border-0 bg-transparent p-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRejectSlug(null);
                setRejectNote("");
              }}
              disabled={rejectSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void confirmReject()}
              disabled={rejectSubmitting}
            >
              {rejectSubmitting ? "Rejecting…" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
