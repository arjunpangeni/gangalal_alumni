"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { scheduleRouterRefresh } from "@/lib/schedule-router-refresh";
import { useI18n } from "@/components/i18n/I18nProvider";

interface Props {
  slug: string;
  status: string;
  /** Admins get immediate delete; members use deletion request. */
  isStaff: boolean;
}

export function MyArticlesActions({ slug, status, isStaff }: Props) {
  const { messages } = useI18n();
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
        title={messages.dashboard.requestDeletionTitle}
        description={messages.dashboard.requestDeletionDesc}
        confirmLabel={messages.dashboard.sendRequest}
        cancelLabel={messages.dashboard.cancel}
        onConfirm={async () => {
          const res = await fetch(`/api/articles/${slug}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "request-delete" }),
          });
          const json = await res.json();
          if (!json.success) {
            toast.error(json.error ?? messages.dashboard.failedSubmitRequest);
            throw new Error("failed");
          }
          toast.success(messages.dashboard.deletionRequestSent);
          scheduleRouterRefresh(() => router.refresh());
        }}
      />
      <ConfirmDialog
        open={confirmKind === "direct-delete"}
        onOpenChange={(open) => {
          if (!open) setConfirmKind(null);
        }}
        title={isPublished ? messages.dashboard.removeFromSiteTitle : messages.dashboard.deleteArticleTitle}
        description={
          isPublished
            ? messages.dashboard.removeFromSiteDesc
            : messages.dashboard.cannotUndo
        }
        confirmLabel={messages.dashboard.delete}
        cancelLabel={messages.dashboard.cancel}
        variant="destructive"
        onConfirm={async () => {
          const res = await fetch(`/api/articles/${slug}`, { method: "DELETE" });
          const json = await res.json();
          if (!json.success) {
            toast.error(json.error ?? messages.dashboard.failedDelete);
            throw new Error("failed");
          }
          toast.success(messages.dashboard.articleDeleted);
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
            {messages.dashboard.viewLive ?? "View live"}
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
            {isPublished && !isStaff ? messages.dashboard.editRereview : messages.dashboard.edit}
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
              {messages.dashboard.delete}
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
              {messages.dashboard.requestDelete ?? "Request delete"}
            </Button>
          )
        ) : null}
      </div>
      {isPublished && !isStaff ? (
        <p className="text-[11px] leading-relaxed text-muted-foreground sm:text-right sm:ml-auto sm:max-w-[19rem]">
          {messages.dashboard.editResubmitHelp}
        </p>
      ) : null}
    </div>
  );
}
