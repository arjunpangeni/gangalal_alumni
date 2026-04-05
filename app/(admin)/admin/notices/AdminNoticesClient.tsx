"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Pencil, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export interface AdminNoticeRow {
  _id: string;
  title: string;
  body: string;
  linkUrl?: string;
  linkLabel?: string;
  isActive: boolean;
  sortOrder: number;
  expiresAt?: string | null;
}

type NoticeForm = {
  title: string;
  body: string;
  linkUrl: string;
  linkLabel: string;
  sortOrder: string;
  expiresAt: string;
  isActive: boolean;
};

function emptyForm(): NoticeForm {
  return {
    title: "",
    body: "",
    linkUrl: "",
    linkLabel: "",
    sortOrder: "0",
    expiresAt: "",
    isActive: true,
  };
}

function rowToForm(r: AdminNoticeRow): NoticeForm {
  return {
    title: r.title,
    body: r.body,
    linkUrl: r.linkUrl ?? "",
    linkLabel: r.linkLabel ?? "",
    sortOrder: String(r.sortOrder),
    expiresAt: r.expiresAt ? r.expiresAt.slice(0, 10) : "",
    isActive: r.isActive,
  };
}

function postPayload(f: NoticeForm) {
  const linkUrl = f.linkUrl.trim();
  const linkLabel = f.linkLabel.trim();
  return {
    title: f.title,
    body: f.body,
    sortOrder: Number.parseInt(f.sortOrder, 10) || 0,
    isActive: f.isActive,
    expiresAt: f.expiresAt || undefined,
    ...(linkUrl ? { linkUrl } : {}),
    ...(linkLabel ? { linkLabel } : {}),
  };
}

/** Full replace of editable fields; empty strings clear optional links on the server. */
function patchPayload(f: NoticeForm) {
  return {
    title: f.title,
    body: f.body,
    linkUrl: f.linkUrl.trim(),
    linkLabel: f.linkLabel.trim(),
    sortOrder: Number.parseInt(f.sortOrder, 10) || 0,
    isActive: f.isActive,
    expiresAt: f.expiresAt ? f.expiresAt : null,
  };
}

function NoticeFields({
  idPrefix,
  form,
  setForm,
  advancedOpen,
  onAdvancedOpenChange,
}: {
  idPrefix: string;
  form: NoticeForm;
  setForm: React.Dispatch<React.SetStateAction<NoticeForm>>;
  advancedOpen: boolean;
  onAdvancedOpenChange: (open: boolean) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-title`} className="text-xs font-medium">
          Title
        </Label>
        <Input
          id={`${idPrefix}-title`}
          className="h-9"
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          required
          maxLength={200}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-body`} className="text-xs font-medium">
          Message
        </Label>
        <Textarea
          id={`${idPrefix}-body`}
          rows={3}
          className="min-h-[4.5rem] resize-y text-sm"
          value={form.body}
          onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
          required
          maxLength={3000}
        />
      </div>
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2">
        <div className="min-w-0">
          <p className="text-xs font-medium">Show on homepage</p>
          <p className="text-[11px] text-muted-foreground">Off keeps the notice in this list only.</p>
        </div>
        <Switch
          checked={form.isActive}
          onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isActive: checked }))}
          aria-label="Show on homepage"
        />
      </div>
      <button
        type="button"
        className={cn(
          "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors",
          "hover:bg-muted/50"
        )}
        onClick={() => onAdvancedOpenChange(!advancedOpen)}
        aria-expanded={advancedOpen}
      >
        Link, sort order &amp; expiry
        <ChevronDown className={cn("size-4 shrink-0 transition-transform", advancedOpen && "rotate-180")} />
      </button>
      {advancedOpen ? (
        <div className="space-y-3 rounded-lg border border-dashed bg-muted/20 p-3">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-link`} className="text-xs">
                Link URL
              </Label>
              <Input
                id={`${idPrefix}-link`}
                className="h-9"
                value={form.linkUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, linkUrl: e.target.value }))}
                placeholder="https://…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-label`} className="text-xs">
                Link label
              </Label>
              <Input
                id={`${idPrefix}-label`}
                className="h-9"
                value={form.linkLabel}
                onChange={(e) => setForm((prev) => ({ ...prev, linkLabel: e.target.value }))}
                placeholder="Read more"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-sort`} className="text-xs">
                Sort order (higher first)
              </Label>
              <Input
                id={`${idPrefix}-sort`}
                type="number"
                className="h-9"
                value={form.sortOrder}
                onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${idPrefix}-exp`} className="text-xs">
                Hide after date
              </Label>
              <Input
                id={`${idPrefix}-exp`}
                type="date"
                className="h-9"
                value={form.expiresAt}
                onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AdminNoticesClient({ initial }: { initial: AdminNoticeRow[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<NoticeForm>(emptyForm);
  const [createAdvancedOpen, setCreateAdvancedOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<NoticeForm>(emptyForm);
  const [editAdvancedOpen, setEditAdvancedOpen] = useState(false);
  const [deleteNoticeId, setDeleteNoticeId] = useState<string | null>(null);

  function openNewNotice() {
    setEditingId(null);
    setCreateForm(emptyForm());
    setCreateAdvancedOpen(false);
    setShowCreateForm(true);
  }

  function cancelNewNotice() {
    setShowCreateForm(false);
    setCreateForm(emptyForm());
    setCreateAdvancedOpen(false);
  }

  function openEdit(row: AdminNoticeRow) {
    setShowCreateForm(false);
    setCreateForm(emptyForm());
    setCreateAdvancedOpen(false);
    setEditForm(rowToForm(row));
    setEditAdvancedOpen(false);
    setEditingId(row._id);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(emptyForm());
    setEditAdvancedOpen(false);
  }

  async function createNotice(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postPayload(createForm)),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Notice created.");
        cancelNewNotice();
        router.refresh();
      } else {
        toast.error(json.error ?? "Failed.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/notices/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchPayload(editForm)),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Notice updated.");
        cancelEdit();
        router.refresh();
      } else {
        toast.error(json.error ?? "Failed.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(row: AdminNoticeRow) {
    const res = await fetch(`/api/notices/${row._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !row.isActive }),
    });
    const json = await res.json();
    if (json.success) {
      toast.success(row.isActive ? "Hidden from homepage." : "Shown on homepage.");
      router.refresh();
    } else toast.error(json.error ?? "Failed.");
  }

  return (
    <div className="max-w-xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Add a short banner for the homepage, or edit one below.</p>
        {!showCreateForm ? (
          <Button type="button" size="sm" className="gradient-primary border-0 text-white shrink-0" onClick={openNewNotice}>
            <Plus className="mr-1.5 size-4" />
            New notice
          </Button>
        ) : null}
      </div>

      {showCreateForm ? (
        <form
          onSubmit={createNotice}
          className="space-y-4 rounded-xl border bg-card p-4 shadow-sm ring-1 ring-border/60"
        >
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-sm font-semibold leading-tight">New notice</h2>
          </div>
          <NoticeFields
            idPrefix="n"
            form={createForm}
            setForm={setCreateForm}
            advancedOpen={createAdvancedOpen}
            onAdvancedOpenChange={setCreateAdvancedOpen}
          />
          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" disabled={saving} onClick={cancelNewNotice}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving} className="gradient-primary border-0 text-white">
              {saving ? <Loader2 className="size-4 animate-spin" /> : null}
              Save notice
            </Button>
          </div>
        </form>
      ) : null}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">Existing notices</h2>
        <ul className="space-y-3">
          {initial.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notices yet.</p>
          ) : (
            initial.map((r) => (
              <li
                key={r._id}
                className="rounded-xl border bg-card p-3 shadow-sm ring-1 ring-border/50 sm:p-4"
              >
                {editingId === r._id ? (
                  <form onSubmit={saveEdit} className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">Edit notice</h3>
                    </div>
                    <NoticeFields
                      idPrefix={`e-${r._id}`}
                      form={editForm}
                      setForm={setEditForm}
                      advancedOpen={editAdvancedOpen}
                      onAdvancedOpenChange={setEditAdvancedOpen}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" disabled={saving} onClick={cancelEdit}>
                        Cancel
                      </Button>
                      <Button type="submit" size="sm" disabled={saving} className="gradient-primary border-0 text-white">
                        {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                        Save changes
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-snug">{r.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.body}</p>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        {r.isActive ? "Active on site" : "Hidden"} · order {r.sortOrder}
                        {r.expiresAt ? ` · until ${r.expiresAt.slice(0, 10)}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Button type="button" variant="outline" size="sm" onClick={() => openEdit(r)}>
                        <Pencil className="mr-1 size-3.5" />
                        Edit
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => void toggleActive(r)}>
                        {r.isActive ? "Hide" : "Show"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteNoticeId(r._id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))
          )}
        </ul>
      </div>

      <ConfirmDialog
        open={deleteNoticeId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteNoticeId(null);
        }}
        title="Delete this notice?"
        description="It will be removed from the homepage banner list."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={async () => {
          if (!deleteNoticeId) return;
          const id = deleteNoticeId;
          const res = await fetch(`/api/notices/${id}`, { method: "DELETE" });
          const json = await res.json();
          if (!json.success) {
            toast.error(json.error ?? "Failed.");
            throw new Error("delete failed");
          }
          toast.success("Deleted.");
          if (editingId === id) cancelEdit();
          router.refresh();
        }}
      />
    </div>
  );
}
