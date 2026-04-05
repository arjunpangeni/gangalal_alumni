"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, Loader2, XCircle } from "lucide-react";

export function AdminArticleReviewActions({ slug, status }: { slug: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  if (status !== "pending") return null;

  async function approve() {
    setLoading("approve");
    try {
      const res = await fetch(`/api/articles/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Article published.");
        router.push("/admin/articles");
        router.refresh();
      } else {
        toast.error(json.error ?? "Failed to approve.");
      }
    } finally {
      setLoading(null);
    }
  }

  async function reject() {
    const note = window.prompt(
      "Optional note for the author. Leave empty to reject without a message. If you type something, use at least 10 characters."
    )?.trim();
    if (note === undefined) return;
    if (note.length > 0 && note.length < 10) {
      toast.error("Note must be at least 10 characters, or leave it empty.");
      return;
    }
    setLoading("reject");
    try {
      const body: { action: string; reason?: string } = { action: "reject" };
      if (note.length > 0) body.reason = note;
      const res = await fetch(`/api/articles/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Article rejected (archived).");
        router.push("/admin/articles");
        router.refresh();
      } else {
        toast.error(json.error ?? "Failed to reject.");
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-2 w-full sm:flex-row sm:flex-wrap sm:w-auto sm:justify-end">
      <Button
        type="button"
        disabled={loading !== null}
        className="w-full min-h-11 sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
        onClick={() => void approve()}
      >
        {loading === "approve" ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
        Approve &amp; publish
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled={loading !== null}
        className="w-full min-h-11 sm:w-auto gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
        onClick={() => void reject()}
      >
        {loading === "reject" ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
        Reject
      </Button>
    </div>
  );
}
