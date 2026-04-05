"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createArticleSchema } from "@/lib/validations/article";
import type { z } from "zod";
import { ArticleEditor } from "@/components/editor/ArticleEditor";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Upload } from "lucide-react";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload-client";
import { UploadProgressBar } from "@/components/ui/UploadProgressBar";

type ArticleFormInput = z.input<typeof createArticleSchema>;

export function NewArticleForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const publishesDirectly =
    session?.user?.role === "admin" || session?.user?.role === "superadmin";
  const [submitting, setSubmitting] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverProgress, setCoverProgress] = useState<number | null>(null);
  const [content, setContent] = useState<object>({ children: [] });
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ArticleFormInput>({
    resolver: zodResolver(createArticleSchema),
    defaultValues: { acl: "public", content: { children: [] }, submitAction: "draft" },
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

  async function submitArticle(data: ArticleFormInput, memberAction: "draft" | "pending") {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = publishesDirectly
        ? { ...data, content }
        : { ...data, content, submitAction: memberAction };
      const c = payload.coverImage;
      if (typeof c !== "string" || !c.trim()) delete payload.coverImage;

      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        if (publishesDirectly) {
          toast.success("Article published.");
        } else if (memberAction === "pending") {
          toast.success("Submitted for review. An admin will publish it after approval.");
        } else {
          toast.success("Draft saved. You can submit it for review anytime from My Articles.");
        }
        router.push("/dashboard/articles");
      } else {
        toast.error(json.error ?? "Failed to save article.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input id="title" placeholder="Enter article title..." className="text-lg" {...register("title")} />
        {errors.title && <p className="text-xs text-destructive">{String(errors.title.message ?? "")}</p>}
      </div>

      <div className="space-y-2">
        <Label>Cover Image</Label>
        <div className="flex flex-wrap items-center gap-3">
          {typeof coverUrl === "string" && coverUrl.trim() !== "" ? (
            <img src={coverUrl} alt="Cover preview" className="h-20 w-32 rounded-lg object-cover border bg-muted" />
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
        <Input
          placeholder="technology, career, education"
          {...register("tags", {
            setValueAs: (v: string) => (v ? v.split(",").map((t: string) => t.trim()).filter(Boolean) : []),
          })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Visibility</Label>
          <Select defaultValue="public" onValueChange={(v) => setValue("acl", v as "public" | "member")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="member">Members Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Content *</Label>
        <ArticleEditor
          value={content}
          onChange={(v) => {
            setContent(v);
            setValue("content", v as Record<string, unknown>);
          }}
        />
        {errors.content && <p className="text-xs text-destructive">Content is required</p>}
      </div>

      <div className="flex flex-wrap gap-3">
        {publishesDirectly ? (
          <Button
            type="button"
            disabled={submitting}
            className="gradient-primary text-white border-0"
            onClick={handleSubmit((d) => submitArticle(d, "draft"))}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Publishing...
              </>
            ) : (
              "Publish"
            )}
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={handleSubmit((d) => submitArticle(d, "draft"))}
            >
              {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Save as draft
            </Button>
            <Button
              type="button"
              disabled={submitting}
              className="gradient-primary text-white border-0"
              onClick={handleSubmit((d) => submitArticle(d, "pending"))}
            >
              {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Submit for review
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
