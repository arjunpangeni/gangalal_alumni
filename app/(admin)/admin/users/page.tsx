import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { PageShell, PageHeader, PageEmptyState } from "@/components/layout/Page";
import { Users } from "lucide-react";
import { AdminUsersClient } from "./AdminUsersClient";

export const unstable_dynamicStaleTime = 30;

interface UserDoc {
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

export default async function AdminUsersPage() {
  await connectDB();
  const users = await User.find({})
    .sort({ createdAt: -1 })
    .limit(50)
    .select("name email image role status createdAt lastLogin profileUpdateRequest")
    .lean();

  const initialUsers = JSON.parse(JSON.stringify(users)) as UserDoc[];

  return (
    <PageShell className="max-w-6xl px-0">
      <PageHeader title="User management" description="Review signups, roles, and account status." />
      {initialUsers.length === 0 ? (
        <PageEmptyState icon={<Users className="size-10" />} title="No users" description="No accounts match the database query." />
      ) : (
        <AdminUsersClient initialUsers={initialUsers} />
      )}
    </PageShell>
  );
}
