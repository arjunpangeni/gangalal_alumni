"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2, Upload, ImageOff } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { UploadProgressBar } from "@/components/ui/UploadProgressBar";
import { useI18n } from "@/components/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { uploadImageToCloudinary } from "@/lib/cloudinary-upload-client";

export type CommitteeRow = {
  _id: string;
  name: string;
  post: string;
  photo?: string;
  sortOrder: number;
};

type FormState = {
  name: string;
  post: string;
  photo: string;
  sortOrder: string;
};

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function emptyForm(sortOrder: number): FormState {
  return { name: "", post: "", photo: "", sortOrder: String(sortOrder) };
}

export function AdminCommitteeClient() {
  const { messages } = useI18n();
  const c = messages.adminClients;
  const [rows, setRows] = useState<CommitteeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormState>(() => emptyForm(0));
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CommitteeRow | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoProgress, setPhotoProgress] = useState<number | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/committee");
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error ?? c.failed);
    }
    setRows(json.data as CommitteeRow[]);
  }, [c.failed]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    load()
      .catch(() => {
        if (!cancelled) toast.error(c.failed);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load, c.failed]);

  function nextDefaultSort(): number {
    const max = rows.reduce((m, r) => Math.max(m, r.sortOrder), 0);
    return max + 1;
  }

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm(nextDefaultSort()));
    setFormOpen(true);
  }

  function openEditForm(r: CommitteeRow) {
    setEditingId(r._id);
    setForm({
      name: r.name,
      post: r.post,
      photo: r.photo ?? "",
      sortOrder: String(r.sortOrder),
    });
    setFormOpen(true);
  }

  function closeForm() {
    setEditingId(null);
    setFormOpen(false);
  }

  async function onPhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (photoInputRef.current) photoInputRef.current.value = "";
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) {
      toast.error(c.committeePhotoTypeError);
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      toast.error(c.committeePhotoSizeError);
      return;
    }
    setPhotoUploading(true);
    setPhotoProgress(0);
    try {
      const url = await uploadImageToCloudinary(file, "committee", (pct) => setPhotoProgress(pct));
      setForm((f) => ({ ...f, photo: url }));
      toast.success(c.committeePhotoUploaded);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : c.failed);
    } finally {
      setPhotoUploading(false);
      setPhotoProgress(null);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const sortOrder = Number.parseInt(form.sortOrder, 10);
      const payload = {
        name: form.name.trim(),
        post: form.post.trim(),
        photo: form.photo.trim(),
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      };

      if (editingId) {
        const res = await fetch(`/api/admin/committee/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          toast.error(json.error ?? c.failed);
          return;
        }
        const updated = json.data as CommitteeRow;
        setRows((prev) => prev.map((x) => (x._id === editingId ? updated : x)).sort((a, b) => b.sortOrder - a.sortOrder));
        toast.success(c.committeeUpdated);
      } else {
        const res = await fetch("/api/admin/committee", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          toast.error(json.error ?? c.failed);
          return;
        }
        const created = json.data as CommitteeRow;
        setRows((prev) => [...prev, created].sort((a, b) => b.sortOrder - a.sortOrder));
        toast.success(c.committeeCreated);
      }
      closeForm();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget._id;
    setActingId(id);
    try {
      const res = await fetch(`/api/admin/committee/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error ?? c.failed);
        throw new Error("delete failed");
      }
      setRows((prev) => prev.filter((x) => x._id !== id));
      if (editingId === id) closeForm();
      toast.success(c.committeeDeleted);
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-8">
      {!formOpen && !loading && rows.length > 0 ? (
        <div className="flex justify-end">
          <Button type="button" size="sm" className="gap-1.5" onClick={openAddForm}>
            <Plus className="size-3.5" />
            {c.committeeAddMember}
          </Button>
        </div>
      ) : null}

      {formOpen ? (
      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
        <p className="text-sm font-semibold text-foreground">{editingId ? c.committeeEditMember : c.committeeAddMember}</p>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar className="size-20 shrink-0 border-2 border-border">
            {form.photo ? <AvatarImage src={form.photo} alt="" className="object-cover" /> : null}
            <AvatarFallback className="text-lg text-muted-foreground">{form.name.slice(0, 1) || "?"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2">
            <input
              ref={photoInputRef}
              type="file"
              accept={PHOTO_TYPES.join(",")}
              className="sr-only"
              aria-hidden
              tabIndex={-1}
              onChange={onPhotoSelected}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={photoUploading || saving}
                className="gap-1.5"
                onClick={() => photoInputRef.current?.click()}
              >
                {photoUploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
                {photoUploading ? c.committeeUploading : c.committeeUploadPhoto}
              </Button>
              {form.photo ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={photoUploading || saving}
                  className="gap-1.5 text-muted-foreground"
                  onClick={() => setForm((f) => ({ ...f, photo: "" }))}
                >
                  <ImageOff className="size-3.5" />
                  {c.committeeRemovePhoto}
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">{c.committeePhotoHint}</p>
            {photoUploading && photoProgress !== null ? (
              <UploadProgressBar value={photoProgress} label={c.committeeUploading} />
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cm-name">{c.committeeName}</Label>
            <Input
              id="cm-name"
              className="h-9"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              maxLength={120}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cm-post">{c.committeePost}</Label>
            <Input
              id="cm-post"
              className="h-9"
              value={form.post}
              onChange={(e) => setForm((f) => ({ ...f, post: e.target.value }))}
              required
              maxLength={120}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="cm-photo-url">{c.committeePhotoUrlOptional}</Label>
            <Input
              id="cm-photo-url"
              className="h-9"
              type="url"
              placeholder="https://..."
              value={form.photo}
              onChange={(e) => setForm((f) => ({ ...f, photo: e.target.value }))}
              maxLength={500}
              disabled={photoUploading}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cm-order">{c.committeeSortOrder}</Label>
            <Input
              id="cm-order"
              className="h-9"
              type="number"
              min={0}
              max={9999}
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="submit" size="sm" disabled={saving || photoUploading}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : editingId ? c.committeeSave : c.committeeCreate}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={closeForm} disabled={saving || photoUploading}>
            {c.committeeCancel}
          </Button>
        </div>
      </form>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="size-8 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed py-10 text-center">
          <p className="max-w-sm text-sm text-muted-foreground">{c.committeeEmpty}</p>
          {!formOpen ? (
            <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={openAddForm}>
              <Plus className="size-3.5" />
              {c.committeeAddMember}
            </Button>
          ) : null}
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li
              key={r._id}
              className={cn(
                "flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between",
                editingId === r._id && "ring-2 ring-primary/40"
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar className="size-12 shrink-0 border">
                  {r.photo ? <AvatarImage src={r.photo} alt="" /> : null}
                  <AvatarFallback className="text-xs">{r.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{r.name}</p>
                  <p className="text-sm text-muted-foreground">{r.post}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {c.committeeOrderLabel}: {r.sortOrder}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEditForm(r)} disabled={actingId !== null}>
                  <Pencil className="mr-1 size-3.5" />
                  {c.committeeEdit}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(r)} disabled={actingId !== null}>
                  <Trash2 className="mr-1 size-3.5" />
                  {c.committeeDelete}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={c.committeeDeleteTitle}
        description={c.committeeDeleteDesc}
        confirmLabel={c.committeeDelete}
        cancelLabel={c.committeeCancel}
        variant="destructive"
        pending={actingId === deleteTarget?._id}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
