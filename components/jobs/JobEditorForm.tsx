"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { jobFormSchema, type CreateJobInput, type JobFormInput } from "@/lib/validations/job";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2, Briefcase } from "lucide-react";

type JobFormValues = z.output<typeof jobFormSchema>;

function initialWorkflow(status: string): "draft" | "pending" | "published" {
  if (status === "published") return "published";
  if (status === "pending") return "pending";
  return "draft";
}

function toDateInputValue(d: Date | string | undefined): string {
  if (!d) return "";
  const x = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(x.getTime())) return "";
  return x.toISOString().slice(0, 10);
}

type Props = {
  mode: "create" | "edit";
  slug?: string;
  canPublishDirectly: boolean;
  initial?: {
    title: string;
    description: string;
    company: string;
    location: string;
    type: string;
    salary?: string;
    educationOrSkills?: string;
    applyUrl?: string;
    applyEmail?: string;
    applyPhone?: string;
    expiresAt?: Date | string;
    tags?: string[];
    acl: "public" | "member";
    status?: string;
  };
};

export function JobEditorForm({ mode, slug, canPublishDirectly, initial }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState<"draft" | "pending" | "published">(() =>
    initial ? initialWorkflow(initial.status ?? "draft") : "draft"
  );

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<JobFormInput, unknown, JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      company: initial?.company ?? "",
      location: initial?.location ?? "",
      type: (initial?.type as JobFormInput["type"]) ?? "full-time",
      salary: initial?.salary ?? "",
      educationOrSkills: initial?.educationOrSkills ?? "",
      applyUrl: initial?.applyUrl ?? "",
      applyEmail: initial?.applyEmail ?? "",
      applyPhone: initial?.applyPhone ?? "",
      expiresAt: toDateInputValue(initial?.expiresAt) as unknown as JobFormInput["expiresAt"],
      tags: initial?.tags ?? [],
      acl: initial?.acl ?? "public",
    },
  });

  function handleCancel() {
    if (isDirty) {
      const ok = window.confirm("Discard your changes and go back to your jobs?");
      if (!ok) return;
    }
    router.push("/dashboard/jobs");
  }

  async function submitCreate(data: JobFormValues, action: "draft" | "pending") {
    setSubmitting(true);
    try {
      const payload: CreateJobInput = {
        ...data,
        expiresAt: data.expiresAt,
        submitAction: canPublishDirectly ? "draft" : action,
      };
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        if (canPublishDirectly) toast.success("Job published.");
        else if (action === "pending") toast.success("Submitted for admin review.");
        else toast.success("Draft saved.");
        router.push("/dashboard/jobs");
      } else {
        toast.error(json.error ?? "Failed to save.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitEdit(data: JobFormValues) {
    if (!slug) return;
    setSubmitting(true);
    try {
      const status: "draft" | "pending" | "published" = canPublishDirectly
        ? workflowStatus
        : workflowStatus === "pending"
          ? "pending"
          : "draft";

      const body: Record<string, unknown> = {
        ...data,
        expiresAt: data.expiresAt,
        status,
      };

      const res = await fetch(`/api/jobs/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        if (status === "pending") toast.success("Updated — pending review.");
        else if (status === "published") toast.success("Job listing updated.");
        else toast.success("Draft saved.");
        router.push("/dashboard/jobs");
      } else {
        toast.error(json.error ?? "Failed to save.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="mx-auto w-full max-w-2xl space-y-6 sm:space-y-8 px-0 pb-8"
      onSubmit={mode === "edit" ? handleSubmit(submitEdit) : (e) => e.preventDefault()}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Briefcase className="size-4 shrink-0 opacity-70" aria-hidden />
          <span>{mode === "create" ? "New listing" : "Editing"}</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full shrink-0 sm:w-auto"
          disabled={submitting}
          onClick={handleCancel}
        >
          Cancel
        </Button>
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-base">Role details</CardTitle>
          <CardDescription>Title, company, location, and how you will work together.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 sm:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="job-title">Job title *</Label>
            <Input
              id="job-title"
              className="min-h-11 text-base sm:text-sm"
              placeholder="e.g. Senior Software Engineer"
              {...register("title")}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input id="company" className="min-h-11" placeholder="Company name" {...register("company")} />
              {errors.company && <p className="text-xs text-destructive">{errors.company.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input id="location" className="min-h-11" placeholder="City, region, or Remote" {...register("location")} />
              {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            <div className="space-y-2">
              <Label>Employment type</Label>
              <Select
                value={watch("type")}
                onValueChange={(v) => setValue("type", v as JobFormValues["type"], { shouldValidate: true, shouldDirty: true })}
              >
                <SelectTrigger className="min-h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="salary">Salary / compensation</Label>
              <Input
                id="salary"
                className="min-h-11"
                placeholder="e.g. NPR 80k–100k (optional)"
                {...register("salary")}
              />
              <p className="text-xs text-muted-foreground leading-snug">
                Leave blank to show <span className="font-medium text-foreground">Negotiable</span> on the public listing.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deadline">
              Application deadline <span className="text-destructive">*</span>
            </Label>
            <Input id="deadline" type="date" className="min-h-11 max-w-full sm:max-w-[14rem]" required {...register("expiresAt")} />
            {errors.expiresAt && <p className="text-xs text-destructive">{String(errors.expiresAt.message)}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="skills">Education &amp; skills (optional)</Label>
            <Textarea
              id="skills"
              placeholder="Degrees, certifications, years of experience, required skills..."
              className="min-h-[100px] text-base sm:text-sm"
              {...register("educationOrSkills")}
            />
            {errors.educationOrSkills && <p className="text-xs text-destructive">{errors.educationOrSkills.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Job description *</Label>
            <Textarea
              id="description"
              placeholder="Role overview, responsibilities, qualifications, benefits, work arrangement…"
              className="min-h-[min(14rem,45vh)] text-base sm:text-sm sm:min-h-[200px]"
              {...register("description")}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-base">How candidates apply</CardTitle>
          <CardDescription>
            Provide at least one: work email, phone/WhatsApp, or an optional external apply link. These appear on the public
            listing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            <div className="space-y-2">
              <Label htmlFor="applyEmail">Application email</Label>
              <Input
                id="applyEmail"
                type="email"
                inputMode="email"
                autoComplete="email"
                className="min-h-11"
                placeholder="e.g. careers@company.com"
                {...register("applyEmail")}
              />
              {errors.applyEmail && <p className="text-xs text-destructive">{errors.applyEmail.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="applyPhone">Phone / WhatsApp</Label>
              <Input
                id="applyPhone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className="min-h-11"
                placeholder="e.g. +977 98XXXXXXXX"
                {...register("applyPhone")}
              />
              {errors.applyPhone && <p className="text-xs text-destructive">{errors.applyPhone.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="applyUrl">External apply link (optional)</Label>
            <Input
              id="applyUrl"
              className="min-h-11"
              placeholder="https://company.com/careers or mailto:…"
              {...register("applyUrl")}
            />
            {errors.applyUrl && <p className="text-xs text-destructive">{errors.applyUrl.message}</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-base">Visibility &amp; tags</CardTitle>
          <CardDescription>Who can see this job and how it is categorized.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select
                value={watch("acl")}
                onValueChange={(v) => setValue("acl", v as "public" | "member", { shouldValidate: true, shouldDirty: true })}
              >
                <SelectTrigger className="min-h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="member">Members only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {mode === "edit" && canPublishDirectly ? (
              <div className="space-y-2">
                <Label>Publication</Label>
                <Select
                  value={workflowStatus}
                  onValueChange={(v) => setWorkflowStatus(v as "draft" | "pending" | "published")}
                >
                  <SelectTrigger className="min-h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending review</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Tags (comma-separated)</Label>
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <Input
                  className="min-h-11"
                  placeholder="react, remote, nonprofit"
                  value={Array.isArray(field.value) ? field.value.join(", ") : ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    field.onChange(v ? v.split(",").map((t) => t.trim()).filter(Boolean) : []);
                  }}
                />
              )}
            />
          </div>
        </CardContent>
      </Card>

      {mode === "create" ? (
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap">
          {canPublishDirectly ? (
            <Button
              type="button"
              disabled={submitting}
              className="min-h-11 w-full gradient-primary border-0 text-white sm:w-auto"
              onClick={handleSubmit((d) => void submitCreate(d, "draft"))}
            >
              {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Publish job
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                className="min-h-11 w-full sm:w-auto"
                onClick={handleSubmit((d) => void submitCreate(d, "draft"))}
              >
                {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Save draft
              </Button>
              <Button
                type="button"
                disabled={submitting}
                className="min-h-11 w-full gradient-primary border-0 text-white sm:w-auto"
                onClick={handleSubmit((d) => void submitCreate(d, "pending"))}
              >
                {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Submit for review
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {!canPublishDirectly ? (
            <div className="space-y-2 rounded-xl border bg-muted/30 p-4 sm:p-5">
              <Label>Publication</Label>
              <Select value={workflowStatus} onValueChange={(v) => setWorkflowStatus(v as "draft" | "pending")}>
                <SelectTrigger className="min-h-11 w-full max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Submit for admin review</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 w-full sm:w-auto"
              disabled={submitting}
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="min-h-11 w-full gradient-primary border-0 text-white sm:w-auto">
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
              ) : workflowStatus === "pending" ? (
                "Submit for review"
              ) : (
                "Save draft"
              )}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
