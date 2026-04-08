"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { scheduleRouterRefresh } from "@/lib/schedule-router-refresh";
import { useI18n } from "@/components/i18n/I18nProvider";

export function MyJobDeleteButton({ slug, title }: { slug: string; title: string }) {
  const { messages } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={messages.dashboard.delete}
        description={`“${title}” ${messages.dashboard.listingDeleteDesc}`}
        confirmLabel={messages.dashboard.delete}
        cancelLabel={messages.dashboard.cancel}
        variant="destructive"
        onConfirm={async () => {
          const res = await fetch(`/api/jobs/${slug}`, { method: "DELETE" });
          const json = await res.json().catch(() => ({}));
          if (!res.ok || !json.success) {
            toast.error(typeof json.error === "string" ? json.error : messages.dashboard.couldNotDeleteListing);
            throw new Error("failed");
          }
          toast.success(messages.dashboard.listingRemoved);
          scheduleRouterRefresh(() => router.refresh());
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-11 w-full gap-2 justify-center border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive sm:min-h-10"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="size-4 shrink-0" aria-hidden />
        {messages.dashboard.delete}
      </Button>
    </>
  );
}
