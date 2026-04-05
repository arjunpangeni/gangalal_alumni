"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { scheduleRouterRefresh } from "@/lib/schedule-router-refresh";

interface Props {
  slug: string;
  status: string;
  /** Admins get immediate delete; members use deletion request. */
  isStaff: boolean;
}

export function MyArticlesActions({ slug, status, isStaff }: Props) {
  const router = useRouter();
  const [confirmKind, setConfirmKind] = useState<null | "request-delete" | "direct-delete">(null);
  const canEdit = status === "draft" || status === "pending" || status === "published";
  const isArchived = status === "archived";
  const isPublished = status === "published";

  return (
    <div className="flex w-full flex-col gap-3">
      <ConfirmDialog
        open={confirmKind === "request-delete"}
        onOpenChange={(open) => {
          if (!open) setConfirmKind(null);
        }}
        title="Request deletion?"
        description="This tells an admin you want this article removed. It stays visible until they process the request. You can keep editing until then."
        confirmLabel="Send request"
        cancelLabel="Cancel"
        onConfirm={async () => {
          const res = await fetch(`/api/articles/${slug}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "request-delete" }),
          });
          const json = await res.json();
          if (!json.success) {
            toast.error(json.error ?? "Failed to submit request.");
            throw new Error("failed");
          }
          toast.success("Deletion request sent. An admin will follow up.");
          scheduleRouterRefresh(() => router.refresh());
        }}
      />
      <ConfirmDialog
        open={confirmKind === "direct-delete"}
        onOpenChange={(open) => {
          if (!open) setConfirmKind(null);
        }}
        title={isPublished ? "Remove this article from the site?" : "Delete this article?"}
        description={
          isPublished
            ? "It will no longer appear in public lists. This cannot be undone."
            : "This cannot be undone."
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={async () => {
          const res = await fetch(`/api/articles/${slug}`, { method: "DELETE" });
          const json = await res.json();
          if (!json.success) {
            toast.error(json.error ?? "Failed to delete.");
            throw new Error("failed");
          }
          toast.success("Article deleted.");
          scheduleRouterRefresh(() => router.refresh());
        }}
      />
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        {isPublished ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="min-h-9 gap-1.5 border border-border/80 bg-background shadow-sm hover:bg-muted/80"
            onClick={() => router.push(`/articles/${slug}`)}
          >
            <ExternalLink className="size-3.5 shrink-0 opacity-70" />
            View live
          </Button>
        ) : null}
        {canEdit && !isArchived ? (
          <Button
            type="button"
            size="sm"
            className="min-h-9 gap-1.5 gradient-primary text-white border-0 shadow-sm"
            onClick={() => router.push(`/content/edit/${slug}`)}
          >
            <Pencil className="size-3.5 shrink-0" />
            {isPublished && !isStaff ? "Edit (re-review)" : "Edit"}
          </Button>
        ) : null}
        {!isArchived ? (
          isStaff ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-9 gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setConfirmKind("direct-delete")}
            >
              <Trash2 className="size-3.5 shrink-0" />
              Delete
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-9 gap-1.5 border-muted-foreground/25 text-muted-foreground hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive"
              onClick={() => setConfirmKind("request-delete")}
            >
              <Trash2 className="size-3.5 shrink-0" />
              Request delete
            </Button>
          )
        ) : null}
      </div>
      {isPublished && !isStaff ? (
        <p className="text-[11px] leading-relaxed text-muted-foreground sm:text-right sm:ml-auto sm:max-w-[19rem]">
          Editing sends your article for approval again; it may be hidden from the public list until an admin approves.
        </p>
      ) : null}
    </div>
  );
}
