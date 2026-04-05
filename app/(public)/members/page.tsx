import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { MembersClient } from "./MembersClient";
import type { Metadata } from "next";
import { PageShell, PageHeader } from "@/components/layout/Page";

export const metadata: Metadata = { title: "Members" };
export const dynamic = "force-dynamic";

interface UserDoc {
  _id: string;
  name: string;
  image?: string;
  profile?: { profession?: string; company?: string; city?: string; batch?: string };
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
    <PageShell className="max-w-6xl">
      <PageHeader
        title="Member directory"
        description={
          <>
            <span className="text-foreground/90">{totalCount.toLocaleString()} verified members.</span> Search the network by
            name and role, then refine by batch, country, or location on the results you have loaded.
          </>
        }
      />
      <MembersClient initialMembers={initialMembers} />
    </PageShell>
  );
}
