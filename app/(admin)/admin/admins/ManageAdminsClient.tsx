"use client";

import { useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, ShieldOff, ShieldPlus } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";

interface UserRow {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  status: string;
  createdAt: string;
}

export function ManageAdminsClient({
  initialAdmins,
  initialCandidates,
}: {
  initialAdmins: UserRow[];
  initialCandidates: UserRow[];
}) {
  const [admins, setAdmins] = useState<UserRow[]>(initialAdmins);
  const [candidates, setCandidates] = useState<UserRow[]>(initialCandidates);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const filteredCandidates = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    if (!q) return candidates;
    return candidates.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [candidates, debouncedSearch]);

  async function performAction(userId: string, nextRole: "admin" | "user") {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "change-role", role: nextRole }),
    });
    const json = await res.json();
    if (!json.success) {
      toast.error(json.error ?? "Action failed.");
      return;
    }

    if (nextRole === "admin") {
      const user = candidates.find((u) => u._id === userId);
      if (!user) return;
      setCandidates((prev) => prev.filter((u) => u._id !== userId));
      setAdmins((prev) =>
        [...prev, { ...user, role: "admin" }].sort((a, b) => a.name.localeCompare(b.name))
      );
      toast.success("Admin access granted.");
    } else {
      const user = admins.find((u) => u._id === userId);
      if (!user) return;
      setAdmins((prev) => prev.filter((u) => u._id !== userId));
      setCandidates((prev) =>
        [...prev, { ...user, role: "user" }].sort((a, b) => a.name.localeCompare(b.name))
      );
      toast.success("Admin access removed.");
    }
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-lg font-semibold mb-4">Current admins</h2>
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium">User</th>
                <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Joined</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    No additional admins yet. Promote members below.
                  </td>
                </tr>
              ) : (
                admins.map((u) => (
                  <tr key={u._id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8 shrink-0">
                          <AvatarImage src={u.image ?? ""} />
                          <AvatarFallback className="text-xs">{u.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-48">{u.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-48">{u.email}</p>
                        </div>
                        <Badge variant="outline" className="capitalize shrink-0 hidden sm:inline-flex">
                          {u.role}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => performAction(u._id, "user")}
                      >
                        <ShieldOff className="size-4" />
                        Remove admin
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Add admin</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Promote approved members to admin. They will be able to moderate content and access the admin area.
        </p>
        <div className="relative flex-1 min-w-48 mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9 max-w-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium">User</th>
                <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Joined</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    No matching members to promote.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((u) => (
                  <tr key={u._id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8 shrink-0">
                          <AvatarImage src={u.image ?? ""} />
                          <AvatarFallback className="text-xs">{u.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-48">{u.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-48">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" className="gap-1.5" onClick={() => performAction(u._id, "admin")}>
                        <ShieldPlus className="size-4" />
                        Make admin
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
