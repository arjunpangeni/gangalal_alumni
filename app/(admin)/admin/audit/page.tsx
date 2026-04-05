import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import AuditLog from "@/lib/models/AuditLog";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PageShell, PageHeader, PageEmptyState } from "@/components/layout/Page";
import { ClipboardList } from "lucide-react";

export const unstable_dynamicStaleTime = 30;

interface AuditDoc {
  _id: string;
  adminId?: { name: string; email: string };
  action: string;
  targetUserId?: { name: string; email: string };
  reason?: string;
  ip?: string;
  timestamp: string;
}

export default async function AuditLogPage() {
  const session = await auth();
  if (session?.user?.role !== "superadmin") redirect("/dashboard");

  await connectDB();
  const logs = await AuditLog.find({})
    .sort({ timestamp: -1 })
    .limit(100)
    .populate("adminId", "name email")
    .populate("targetUserId", "name email")
    .lean();

  const rows = logs as unknown as AuditDoc[];

  return (
    <PageShell className="max-w-6xl px-0">
      <PageHeader title="Audit logs" description="Recent admin actions on members and roles." />
      {rows.length === 0 ? (
        <PageEmptyState
          icon={<ClipboardList className="size-10" />}
          title="No log entries yet"
          description="Actions from this point forward will appear here."
        />
      ) : (
        <div className="-mx-1 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="sticky left-0 z-10 bg-muted/50 px-4 py-3 text-left font-medium backdrop-blur-sm">Admin</th>
                <th className="px-4 py-3 text-left font-medium">Action</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Target</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Reason</th>
                <th className="px-4 py-3 text-left font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((log) => (
                <tr key={log._id} className="hover:bg-muted/20">
                  <td className="sticky left-0 z-10 bg-card px-4 py-3 text-xs text-muted-foreground backdrop-blur-sm">
                    {log.adminId?.name ?? "System"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="capitalize">
                      {log.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                    {log.targetUserId?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell max-w-xs truncate">
                    {log.reason ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(log.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageShell>
  );
}
