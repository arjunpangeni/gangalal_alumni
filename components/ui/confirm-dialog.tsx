"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
  pending?: boolean;
  /**
   * Resolve on success to close the dialog. Reject or throw on failure so it stays open.
   */
  onConfirm: () => void | Promise<void>;
  contentClassName?: string;
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  variant = "default",
  pending = false,
  onConfirm,
  contentClassName,
}: ConfirmDialogProps) {
  const [internalPending, setInternalPending] = React.useState(false);
  const busy = pending || internalPending;

  async function handleConfirm() {
    setInternalPending(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      /* keep dialog open */
    } finally {
      setInternalPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton className={cn("sm:max-w-md", contentClassName)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            disabled={busy}
            className={cn(
              "gap-2",
              variant === "destructive" &&
                "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
            onClick={() => void handleConfirm()}
          >
            {busy ? <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden /> : null}
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
