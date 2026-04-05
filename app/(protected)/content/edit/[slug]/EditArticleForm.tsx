"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createArticleSchema } from "@/lib/validations/article";
import { ArticleEditor } from "@/components/editor/ArticleEditor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload-client";
import { UploadProgressBar } from "@/components/ui/UploadProgressBar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type ArticleFormInput = z.input<typeof createArticleSchema>;

type InitialArticle = {
  title: string;
  content: object;
  coverImage?: string;
  tags?: string[];
  acl: "public" | "member";
  status: string;
};

function initialWorkflow(status: string): "draft" | "pending" | "published" {
  if (status === "published") return "published";
  if (status === "pending") return "pending";
  return "draft";
}

export function EditArticleForm({
  slug,
  initial,
  canPublishDirectly,
  returnPath = "/dashboard/articles",
}: {
  slug: string;
  initial: InitialArticle;
  canPublishDirectly: boolean;
  returnPath?: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverProgress, setCoverProgress] = useState<number | null>(null);
  const [content, setContent] = useState<object>(
    initial.content && typeof initial.content === "object"
      ? initial.content
      : { children: [] }
  );
  const isRepublishFlow = !canPublishDirectly && initial.status === "published";

  const [workflowStatus, setWorkflowStatus] = useState<"draft" | "pending" | "published">(() => {
    if (isRepublishFlow) return "pending";
    return initialWorkflow(initial.status);
  });

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors, isDirty },
  } = useForm<ArticleFormInput>({
    resolver: zodResolver(createArticleSchema),
    defaultValues: {
      title: initial.title,
      acl: initial.acl ?? "public",
      content: initial.content as Record<string, unknown>,
      tags: initial.tags ?? [],
      coverImage: initial.coverImage,
      submitAction: "draft",
    },
  });

  const coverUrl = watch("coverImage");

  async function uploadCover(file: File) {
    setCoverUploading(true);
    setCoverProgress(0);
    try {
      const url = await uploadImageToCloudinary(file, "covers", (pct) => setCoverProgress(pct));
      setValue("coverImage", url, { shouldValidate: true, shouldDirty: true });
      toast.success("Cover image uploaded.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload cover image.");
    } finally {
      setCoverUploading(false);
      setCoverProgress(null);
    }
  }

  async function onSubmit(data: ArticleFormInput) {
    setSubmitting(true);
    try {
      const status: "draft" | "pending" | "published" = canPublishDirectly
        ? workflowStatus
        : isRepublishFlow || workflowStatus === "pending"
          ? "pending"
          : "draft";

      const { submitAction: _sa, ...rest } = data;
      const body: Record<string, unknown> = {
        ...rest,
        content,
        status,
      };
      const c = body.coverImage;
      if (typeof c !== "string" || !c.trim()) delete body.coverImage;

      const res = await fetch(`/api/articles/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        if (status === "pending") {
          toast.success(
            isRepublishFlow
              ? "Updates submitted. Your article will be reviewed again before it appears publicly."
              : "Submitted for review. An admin will publish it when approved."
          );
        } else if (status === "published") {
          toast.success("Article published.");
        } else {
          toast.success("Draft saved.");
        }
        router.push(returnPath);
      } else {
        toast.error(json.error ?? "Failed to save article.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    if (isDirty) {
      setDiscardOpen(true);
      return;
    }
    router.push(returnPath);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <ConfirmDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        title="Discard changes?"
        description="Your edits will be lost. You can keep editing or go back without saving."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        variant="destructive"
        onConfirm={async () => {
          router.push(returnPath);
        }}
      />

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full sm:w-auto shrink-0"
          disabled={submitting}
          onClick={handleCancel}
        >
          Cancel
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input id="title" placeholder="Enter article title..." className="text-lg" {...register("title")} />
        {errors.title && <p className="text-xs text-destructive">{String(errors.title.message ?? "")}</p>}
      </div>

      <div className="space-y-2">
        <Label>Cover Image</Label>
        <div className="flex items-center gap-3">
          {typeof coverUrl === "string" && coverUrl.trim() ? (
            <img src={coverUrl} alt="Cover" className="h-20 w-32 rounded-lg object-cover border bg-muted" />
          ) : null}
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors">
            {coverUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {coverUploading ? "Uploading..." : "Upload Cover"}
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadCover(f);
              }}
            />
          </label>
        </div>
        {coverUploading && coverProgress !== null ? (
          <UploadProgressBar value={coverProgress} label="Uploading cover…" className="max-w-md" />
        ) : null}
        {errors.coverImage && <p className="text-xs text-destructive">{String(errors.coverImage.message ?? "")}</p>}
      </div>

      <div className="space-y-2">
        <Label>Tags (comma-separated)</Label>
        <Controller
          name="tags"
          control={control}
          render={({ field }) => (
            <Input
              placeholder="technology, career, education"
              value={Array.isArray(field.value) ? field.value.join(", ") : ""}
              onChange={(e) => {
                const v = e.target.value;
                field.onChange(v ? v.split(",").map((t) => t.trim()).filter(Boolean) : []);
              }}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Visibility</Label>
          <Select
            defaultValue={initial.acl ?? "public"}
            onValueChange={(v) => setValue("acl", v as "public" | "member", { shouldDirty: true })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="member">Members Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Publication</Label>
          {canPublishDirectly ? (
            <Select
              value={workflowStatus}
              onValueChange={(v) => setWorkflowStatus(v as "draft" | "pending" | "published")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending review</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          ) : isRepublishFlow ? (
            <div className="rounded-lg border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
              Saving will send this article for <strong className="text-foreground">admin review again</strong>. It may be
              hidden from the public site until approved.
            </div>
          ) : (
            <Select value={workflowStatus} onValueChange={(v) => setWorkflowStatus(v as "draft" | "pending")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Submit for admin review</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Content *</Label>
        <ArticleEditor
          value={content}
          onChange={(v) => {
            setContent(v);
            setValue("content", v as Record<string, unknown>, { shouldDirty: true });
          }}
        />
        {errors.content && <p className="text-xs text-destructive">Content is required</p>}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={submitting} className="gradient-primary text-white border-0">
          {submitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Saving…
            </>
          ) : canPublishDirectly ? (
            workflowStatus === "published" ? (
              "Save (published)"
            ) : workflowStatus === "pending" ? (
              "Save (pending review)"
            ) : (
              "Save draft"
            )
          ) : isRepublishFlow ? (
            "Submit changes for review"
          ) : workflowStatus === "pending" ? (
            "Submit for review"
          ) : (
            "Save draft"
          )}
        </Button>
      </div>
    </form>
  );
}
