import connectDB from "@/lib/db";
import CommitteeMember from "@/lib/models/CommitteeMember";

export type PublicCommitteeRow = {
  _id: string;
  name: string;
  post: string;
  photo?: string;
  sortOrder: number;
};

/** Loads committee for the public About page only (call from the /about route). */
export async function getCommitteeMembersForPublic(): Promise<PublicCommitteeRow[]> {
  await connectDB();
  const raw = await CommitteeMember.find({})
    .sort({ sortOrder: -1, createdAt: -1 })
    .select("name post photo sortOrder")
    .lean();

  return raw.map((r) => ({
    _id: String(r._id),
    name: r.name as string,
    post: r.post as string,
    photo: ((r.photo as string | undefined) ?? "").trim() || undefined,
    sortOrder: (r.sortOrder as number) ?? 0,
  }));
}
