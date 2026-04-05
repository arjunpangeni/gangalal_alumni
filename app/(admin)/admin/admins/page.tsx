import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageShell, PageHeader } from "@/components/layout/Page";
import { ManageAdminsClient } from "./ManageAdminsClient";

interface UserDoc {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role: string;
  status: string;
  createdAt: string;
}

export default async function ManageAdminsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "superadmin") {
    redirect("/admin/users");
  }

  await connectDB();
  const [admins, candidates] = await Promise.all([
    User.find({ role: "admin", status: "approved" })
      .sort({ name: 1 })
      .select("name email image role status createdAt")
      .limit(100)
      .lean(),
    User.find({ role: "user", status: "approved" })
      .sort({ name: 1 })
      .select("name email image role status createdAt")
      .limit(300)
      .lean(),
  ]);

  const serial = (u: unknown[]) => JSON.parse(JSON.stringify(u)) as UserDoc[];

  return (
    <PageShell className="max-w-4xl px-0">
      <PageHeader
        title="Manage admins"
        description="Grant or revoke admin access for approved members. Superadmin accounts are not listed here."
      />
      <ManageAdminsClient initialAdmins={serial(admins)} initialCandidates={serial(candidates)} />
    </PageShell>
  );
}
