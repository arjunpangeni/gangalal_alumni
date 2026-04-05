import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { MembersClient } from "./MembersClient";
import type { Metadata } from "next";
import { PageShell } from "@/components/layout/Page";
import { PageListingShell } from "@/components/layout/PageListingShell";

export const metadata: Metadata = { title: "Members" };
export const dynamic = "force-dynamic";

interface UserDoc {
  _id: string;
  name: string;
  image?: string;
  profile?: {
    profession?: string;
    company?: string;
    city?: string;
    country?: string;
    batch?: string;
    slcSeeBatch?: number;
  };
}

export default async function MembersPage() {
  let initialMembers: UserDoc[] = [];
  let totalCount = 0;
  try {
    await connectDB();
    const [members, count] = await Promise.all([
      User.find({ status: "approved" })
        .sort({ createdAt: -1 })
        .limit(20)
        .select("name image profile")
        .lean(),
      User.countDocuments({ status: "approved" }),
    ]);
    initialMembers = JSON.parse(JSON.stringify(members)) as UserDoc[];
    totalCount = count;
  } catch { /* DB unavailable */ }

  return (
    <PageListingShell>
      <PageShell className="max-w-6xl">
        <MembersClient initialMembers={initialMembers} totalCount={totalCount} />
      </PageShell>
    </PageListingShell>
  );
}
