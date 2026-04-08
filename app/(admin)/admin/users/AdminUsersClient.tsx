"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Search,
  CheckCircle,
  XCircle,
  Ban,
  Shield,
  ShieldCheck,
  UserCheck,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { AdminUserEditDialog } from "./AdminUserEditDialog";
import { formatDate } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { useI18n } from "@/components/i18n/I18nProvider";

interface User {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  status: string;
  createdAt: string;
  lastLogin?: string;
  profileUpdateRequest?: { status?: string } | null;
}

function isStaffRole(role: string) {
  return role === "admin" || role === "superadmin";
}

export function AdminUsersClient({ initialUsers }: { initialUsers: User[] }) {
  const { messages } = useI18n();
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState<"all" | "staff" | "user">("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [actingId, setActingId] = useState<string | null>(null);

  const [reasonDialog, setReasonDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
    mode: "reject" | "ban";
  }>({ open: false, userId: "", userName: "", mode: "reject" });
  const [reasonText, setReasonText] = useState("");

  const [removeDialog, setRemoveDialog] = useState<{
    open: boolean;
    userId: string;
    userName: string;
  }>({ open: false, userId: "", userName: "" });
  const [removeReason, setRemoveReason] = useState("");

  const [editUserId, setEditUserId] = useState<string | null>(null);

  const filtered = users.filter((u) => {
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    const matchesRole =
      roleFilter === "all" ||
      (roleFilter === "staff" && isStaffRole(u.role)) ||
      (roleFilter === "user" && u.role === "user");
    const q = debouncedSearch.toLowerCase();
    const matchesSearch =
      !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchesStatus && matchesRole && matchesSearch;
  });

  async function performAction(userId: string, action: string, extra?: object) {
    setActingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const json = await res.json();
      if (json.success) {
        if (json.data?.removed) {
          setUsers((prev) => prev.filter((u) => u._id !== userId));
          toast.success("Account removed from the directory.");
        } else {
          setUsers((prev) =>
            prev.map((u) =>
              u._id === userId
                ? {
                    ...u,
                    ...json.data,
                    profileUpdateRequest:
                      json.data?.profileUpdateRequest === null
                        ? undefined
                        : (json.data?.profileUpdateRequest ?? u.profileUpdateRequest),
                  }
                : u
            )
          );
          toast.success("Updated successfully.");
        }
      } else {
        toast.error(json.error ?? "Action failed.");
      }
    } finally {
      setActingId(null);
    }
  }

  function openReasonDialog(user: User, mode: "reject" | "ban") {
    setReasonText(
      mode === "reject"
        ? "Application does not meet verification criteria for Gangalal ALumni."
        : "Account restricted due to violation of community guidelines."
    );
    setReasonDialog({ open: true, userId: user._id, userName: user.name, mode });
  }

  function submitReasonDialog() {
    const t = reasonText.trim();
    if (t.length < 10) {
      toast.error("Please enter a reason (at least 10 characters).");
      return;
    }
    const { userId, mode } = reasonDialog;
    setReasonDialog((d) => ({ ...d, open: false }));
    void performAction(userId, mode === "reject" ? "reject" : "ban", { reason: t });
  }

  const isSuperAdmin = session?.user?.role === "superadmin";
  const isAdminUser = session?.user?.role === "admin" || isSuperAdmin;
  const currentUserId = session?.user?.id;

  function canEditProfile(u: User) {
    if (!isAdminUser) return false;
    if (u.role === "superadmin" && currentUserId !== u._id) return false;
    if (u.role === "admin" && !isSuperAdmin) return false;
    return true;
  }

  function submitRemoveDialog() {
    const t = removeReason.trim();
    if (t.length < 10) {
      toast.error("Please enter a reason (at least 10 characters).");
      return;
    }
    const { userId } = removeDialog;
    setRemoveDialog((d) => ({ ...d, open: false }));
    void performAction(userId, "remove-user", { reason: t });
  }

  function UserActions({ u }: { u: User }) {
    const staff = isStaffRole(u.role);
    const self = currentUserId === u._id;
    const busy = actingId === u._id;

    return (
      <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[11rem]">
        {staff && (
          <p className="text-xs text-muted-foreground rounded-md bg-muted/60 px-2 py-1.5 border border-border/60">
            <ShieldCheck className="inline size-3.5 mr-1 align-text-bottom text-primary" />
            Staff account — cannot be banned or declined.
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          {canEditProfile(u) && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full sm:w-auto gap-1.5"
              disabled={busy}
              onClick={() => setEditUserId(u._id)}
            >
              <Pencil className="size-3.5" />
              {messages.adminUsers.editProfile}
            </Button>
          )}

          {!staff && !self && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full sm:w-auto gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
              disabled={busy}
              onClick={() => {
                setRemoveReason(
                  "Member requested account removal / duplicate signup / data cleanup per admin review."
                );
                setRemoveDialog({ open: true, userId: u._id, userName: u.name });
              }}
            >
              <Trash2 className="size-3.5" />
              {messages.adminUsers.delete}
            </Button>
          )}
          {u.status === "pending" && !staff && (
            <>
              <Button
                type="button"
                size="sm"
                className="w-full sm:w-auto gap-1.5 gradient-primary text-white border-0"
                disabled={busy}
                onClick={() => performAction(u._id, "approve")}
              >
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : <UserCheck className="size-3.5" />}
                Approve
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full sm:w-auto gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
                disabled={busy || self}
                onClick={() => openReasonDialog(u, "reject")}
                title={self ? "Cannot decline your own account" : undefined}
              >
                <XCircle className="size-3.5" />
                Decline
              </Button>
            </>
          )}

          {u.status === "approved" && !staff && (
            <>
              {u.profileUpdateRequest?.status === "pending" && (
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button
                    type="button"
                    size="sm"
                    className="w-full sm:w-auto gap-1.5 gradient-primary text-white border-0"
                    disabled={busy}
                    onClick={() => performAction(u._id, "approve-profile-update")}
                  >
                    {busy ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle className="size-3.5" />}
                    Approve profile
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto gap-1.5"
                    disabled={busy}
                    onClick={() => performAction(u._id, "reject-profile-update")}
                  >
                    <XCircle className="size-3.5" />
                    Reject profile
                  </Button>
                </div>
              )}
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full sm:w-auto gap-1.5 border-orange-500/50 text-orange-700 dark:text-orange-400 hover:bg-orange-500/10"
                disabled={busy || self}
                onClick={() => openReasonDialog(u, "ban")}
                title={self ? "Cannot ban your own account" : undefined}
              >
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Ban className="size-3.5" />}
                Ban user
              </Button>
            </>
          )}

          {u.status === "banned" && (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="w-full sm:w-auto gap-1.5"
              disabled={busy}
              onClick={() => performAction(u._id, "unban")}
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle className="size-3.5" />}
              Restore access
            </Button>
          )}

          {u.status === "rejected" && !staff && (
            <Button
              type="button"
              size="sm"
              className="w-full sm:w-auto gap-1.5 gradient-primary text-white border-0"
              disabled={busy}
              onClick={() => performAction(u._id, "approve")}
            >
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <UserCheck className="size-3.5" />}
              Approve anyway
            </Button>
          )}

          {isSuperAdmin && u.role !== "superadmin" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full sm:w-auto gap-1.5 border-violet-500/40 text-violet-700 dark:text-violet-300"
              disabled={busy}
              onClick={() =>
                performAction(u._id, "change-role", {
                  role: u.role === "admin" ? "user" : "admin",
                })
              }
            >
              <Shield className="size-3.5" />
              {u.role === "admin" ? "Demote to member" : "Promote to admin"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 mb-6">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={messages.adminUsers.searchPlaceholder}
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "all")}>
          <SelectTrigger className="w-full sm:w-[11rem] shrink-0">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            {["all", "pending", "approved", "rejected", "banned"].map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s === "all" ? "All statuses" : s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={roleFilter}
          onValueChange={(v) => {
            if (v === "staff" || v === "user") setRoleFilter(v);
            else setRoleFilter("all");
          }}
        >
          <SelectTrigger className="w-full sm:w-[11rem] shrink-0">
            <SelectValue placeholder="Filter role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="staff">Admins</SelectItem>
            <SelectItem value="user">Users</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-muted-foreground mb-4 sm:mb-5">
        Admins can edit member profiles and permanently remove non-staff accounts (with a reason). Banning restricts
        access without deleting data. Staff accounts cannot be banned, declined, or removed from this panel.
      </p>

      {/* Mobile-first cards; comfortable on desktop too */}
      <ul className="space-y-3">
        {filtered.map((u) => (
          <li
            key={u._id}
            className="rounded-xl border bg-card p-4 shadow-sm/5 flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6"
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <Avatar className="size-11 shrink-0 ring-2 ring-border/80">
                <AvatarImage src={u.image ?? ""} />
                <AvatarFallback className="text-sm font-medium">{u.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2 gap-y-1">
                  <p className="font-semibold leading-tight break-words">{u.name}</p>
                  <Badge variant="outline" className="capitalize shrink-0 text-xs">
                    {u.role}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground break-all">{u.email}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Badge
                    variant={
                      u.status === "approved"
                        ? "default"
                        : u.status === "pending"
                          ? "secondary"
                          : "destructive"
                    }
                    className="capitalize"
                  >
                    {u.status}
                  </Badge>
                  {u.profileUpdateRequest?.status === "pending" && u.status === "approved" && (
                    <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-800 dark:text-amber-200">
                      Profile changes pending
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">Joined {formatDate(u.createdAt)}</span>
                </div>
              </div>
            </div>
            <UserActions u={u} />
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed py-16 text-center text-muted-foreground text-sm">
          No users match this filter.
        </div>
      )}

      <Dialog
        open={reasonDialog.open}
        onOpenChange={(open) => setReasonDialog((d) => ({ ...d, open }))}
      >
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>
              {reasonDialog.mode === "reject" ? "Decline application" : "Ban user"}
            </DialogTitle>
            <DialogDescription>
              {reasonDialog.mode === "reject"
                ? `Decline ${reasonDialog.userName}’s access request. They will be notified by email.`
                : `Ban ${reasonDialog.userName}. They will lose access until you restore their account.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-1">
            <Label htmlFor="admin-user-reason">Reason (min. 10 characters)</Label>
            <Textarea
              id="admin-user-reason"
              rows={4}
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              className="resize-y min-h-[5rem]"
            />
          </div>
          <DialogFooter className="border-0 bg-transparent p-0 pt-2 sm:justify-end flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setReasonDialog((d) => ({ ...d, open: false }))}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={reasonDialog.mode === "reject" ? "destructive" : "default"}
              className={
                reasonDialog.mode === "ban"
                  ? "w-full sm:w-auto bg-orange-600 hover:bg-orange-600/90 text-white"
                  : "w-full sm:w-auto"
              }
              onClick={submitReasonDialog}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={removeDialog.open} onOpenChange={(open) => setRemoveDialog((d) => ({ ...d, open }))}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Remove account permanently</DialogTitle>
            <DialogDescription>
              This deletes {removeDialog.userName || "this member"}&apos;s user record. It is not the same as a ban.
              This cannot be undone from the dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-1">
            <Label htmlFor="admin-remove-reason">Reason (min. 10 characters)</Label>
            <Textarea
              id="admin-remove-reason"
              rows={4}
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              className="resize-y min-h-[5rem]"
            />
          </div>
          <DialogFooter className="border-0 bg-transparent p-0 pt-2 sm:justify-end flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setRemoveDialog((d) => ({ ...d, open: false }))}
            >
              Cancel
            </Button>
            <Button type="button" variant="destructive" className="w-full sm:w-auto" onClick={submitRemoveDialog}>
              Remove account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminUserEditDialog
        userId={editUserId}
        open={editUserId !== null}
        onOpenChange={(open) => {
          if (!open) setEditUserId(null);
        }}
        onSaved={({ userId, name, image }) => {
          setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, name, image } : u)));
        }}
      />
    </>
  );
}
