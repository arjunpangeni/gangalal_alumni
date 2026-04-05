import { notFound } from "next/navigation";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import Article from "@/lib/models/Article";
import { auth } from "@/lib/auth";
import { MemberPublicProfile, type PublicMemberData, type PublicMemberArticle } from "@/components/members/MemberPublicProfile";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }): Promise<Metadata> {
  const { userId } = await params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return { title: "Member" };
  }
  try {
    await connectDB();
    const u = await User.findOne({ _id: userId, status: "approved" }).select("name").lean();
    if (!u) return { title: "Member not found" };
    const name = typeof u.name === "string" ? u.name : "Member";
    return { title: `${name} · Members`, description: `Profile of ${name} on the alumni network.` };
  } catch {
    return { title: "Member" };
  }
}

export default async function MemberProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    notFound();
  }

  const session = await auth();

  const raw = await User.findOne({ _id: userId, status: "approved" })
    .select(
      "name email image profile availableForMentorship mentorshipBio mentorshipSkills createdAt"
    )
    .lean();

  if (!raw || !raw._id) {
    notFound();
  }

  const profile = (raw.profile ?? {}) as PublicMemberData["profile"];

  const member: PublicMemberData = {
    id: String(raw._id),
    name: String(raw.name ?? "Member"),
    email: String(raw.email ?? ""),
    image: typeof raw.image === "string" ? raw.image : undefined,
    joinedAt: (raw.createdAt as Date)?.toISOString?.() ?? new Date().toISOString(),
    profile: {
      bio: profile.bio,
      slcSeeBatch: profile.slcSeeBatch,
      schoolPeriod: profile.schoolPeriod,
      profession: profile.profession,
      company: profile.company,
      permanentAddress: profile.permanentAddress,
      city: profile.city,
      country: profile.country,
      linkedin: profile.linkedin,
      facebook: profile.facebook,
      phone: profile.phone,
    },
    availableForMentorship: Boolean(raw.availableForMentorship),
    mentorshipBio: typeof raw.mentorshipBio === "string" ? raw.mentorshipBio : undefined,
    mentorshipSkills: Array.isArray(raw.mentorshipSkills)
      ? (raw.mentorshipSkills as string[]).filter((s) => typeof s === "string")
      : [],
  };

  const articleFilter: Record<string, unknown> = {
    authorId: raw._id,
    status: "published",
    deletedAt: null,
  };
  if (!session?.user) {
    articleFilter.acl = "public";
  }

  const articlesRaw = await Article.find(articleFilter)
    .sort({ createdAt: -1 })
    .limit(12)
    .select("title slug excerpt coverImage tags readTime createdAt")
    .lean();

  const articles: PublicMemberArticle[] = articlesRaw.map((a) => ({
    title: String(a.title ?? ""),
    slug: String(a.slug ?? ""),
    excerpt: typeof a.excerpt === "string" ? a.excerpt : undefined,
    coverImage: typeof a.coverImage === "string" ? a.coverImage : undefined,
    tags: Array.isArray(a.tags) ? (a.tags as string[]) : undefined,
    readTime: typeof a.readTime === "number" ? a.readTime : undefined,
    createdAt: (a.createdAt as Date)?.toISOString?.() ?? new Date().toISOString(),
  }));

  return <MemberPublicProfile member={member} articles={articles} isLoggedIn={!!session?.user} />;
}
