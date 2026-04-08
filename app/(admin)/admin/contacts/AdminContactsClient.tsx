"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Trash2, Mail } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatDate } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { useI18n } from "@/components/i18n/I18nProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ADMIN_CONTACTS_PENDING_COUNT_EVENT } from "@/lib/admin-contact-events";

function notifyAdminPendingCountChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(ADMIN_CONTACTS_PENDING_COUNT_EVENT));
  }
}

export type AdminContactRow = {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "pending" | "resolved";
  ip?: string;
  createdAt: string;
};

export function AdminContactsClient() {
  const { messages } = useI18n();
  const ac = messages.adminContacts;
  const [rows, setRows] = useState<AdminContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "resolved">("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [actingId, setActingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminContactRow | null>(null);
  const [detail, setDetail] = useState<AdminContactRow | null>(null);

  const fetchList = useCallback(async () => {
    const qs = new URLSearchParams();
    if (statusFilter !== "all") qs.set("status", statusFilter);
    if (debouncedSearch.trim()) qs.set("q", debouncedSearch.trim());
    const res = await fetch(`/api/admin/contacts?${qs}`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error ?? messages.adminClients.failed);
    }
    setRows(json.data as AdminContactRow[]);
  }, [statusFilter, debouncedSearch, messages.adminClients.failed]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchList()
      .catch(() => {
        if (!cancelled) toast.error(messages.adminClients.failed);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchList, messages.adminClients.failed]);

  async function setStatus(id: string, status: "pending" | "resolved") {
    setActingId(id);
    try {
      const res = await fetch(`/api/admin/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error ?? messages.adminClients.failed);
        return;
      }
      const updated = json.data as AdminContactRow;
      setRows((prev) => prev.map((r) => (r._id === id ? { ...r, ...updated } : r)));
      setDetail((d) => (d && d._id === id ? { ...d, ...updated } : d));
      toast.success(ac.statusUpdated);
      notifyAdminPendingCountChanged();
    } finally {
      setActingId(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget._id;
    setActingId(id);
    try {
      const res = await fetch(`/api/admin/contacts/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error ?? messages.adminClients.failed);
        throw new Error("delete failed");
      }
      setRows((prev) => prev.filter((r) => r._id !== id));
      setDetail((d) => (d?._id === id ? null : d));
      toast.success(ac.deleted);
      notifyAdminPendingCountChanged();
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder={ac.filterStatus} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{ac.filterAll}</SelectItem>
              <SelectItem value="pending">{ac.statusPending}</SelectItem>
              <SelectItem value="resolved">{ac.statusResolved}</SelectItem>
            </SelectContent>
          </Select>
          <Input
            className="w-full sm:w-64"
            placeholder={ac.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={ac.searchPlaceholder}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          <Loader2 className="size-8 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          {ac.noMessages}
        </p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {rows.map((row) => (
            <li key={row._id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
              <button
                type="button"
                onClick={() => setDetail(row)}
                className="min-w-0 flex-1 text-left hover:opacity-90"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{row.subject}</span>
                  <Badge variant={row.status === "resolved" ? "secondary" : "default"}>
                    {row.status === "resolved" ? ac.statusResolved : ac.statusPending}
                  </Badge>
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {row.name} · {row.email}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{row.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(row.createdAt)}</p>
              </button>
              <div className="flex flex-shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actingId === row._id || row.status === "pending"}
                  onClick={() => setStatus(row._id, "pending")}
                >
                  {ac.markPending}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actingId === row._id || row.status === "resolved"}
                  onClick={() => setStatus(row._id, "resolved")}
                >
                  {ac.markResolved}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={actingId === row._id}
                  onClick={() => setDeleteTarget(row)}
                >
                  <Trash2 className="mr-1 size-3.5" />
                  {ac.delete}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 pr-8">
              <Mail className="size-4" />
              {detail?.subject}
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {ac.from}
                </p>
                <p className="font-medium">{detail.name}</p>
                <a href={`mailto:${detail.email}`} className="text-primary underline-offset-4 hover:underline">
                  {detail.email}
                </a>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {ac.message}
                </p>
                <p className="whitespace-pre-wrap text-foreground">{detail.message}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{formatDate(detail.createdAt)}</span>
                {detail.ip ? <span>IP: {detail.ip}</span> : null}
              </div>
              <div className="flex flex-wrap gap-2 border-t pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actingId === detail._id || detail.status === "pending"}
                  onClick={() => setStatus(detail._id, "pending")}
                >
                  {ac.markPending}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={actingId === detail._id || detail.status === "resolved"}
                  onClick={() => setStatus(detail._id, "resolved")}
                >
                  {ac.markResolved}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={actingId === detail._id}
                  onClick={() => {
                    setDeleteTarget(detail);
                  }}
                >
                  {ac.delete}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={ac.confirmDeleteTitle}
        description={ac.confirmDeleteDesc}
        confirmLabel={ac.delete}
        cancelLabel={ac.cancel}
        variant="destructive"
        pending={actingId === deleteTarget?._id}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
