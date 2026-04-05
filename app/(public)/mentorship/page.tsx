import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import type { Metadata } from "next";
import { PageShell } from "@/components/layout/Page";
import { PageListingShell } from "@/components/layout/PageListingShell";
import { MentorshipClient } from "./MentorshipClient";

export const metadata: Metadata = {
  title: "Mentorship",
  description: "Connect with alumni mentors by email.",
};
export const revalidate = 60;

interface UserDoc {
  _id: string;
  name: string;
  email: string;
  image?: string;
  profile?: { profession?: string; company?: string; city?: string; linkedin?: string };
  mentorshipBio?: string;
  mentorshipSkills?: string[];
}

export default async function MentorshipPage() {
  let mentors: UserDoc[] = [];
  try {
    await connectDB();
    const raw = await User.find({ status: "approved", availableForMentorship: true })
      .sort({ createdAt: -1 })
      .select("name email image profile mentorshipBio mentorshipSkills")
      .lean();
    mentors = JSON.parse(JSON.stringify(raw)) as UserDoc[];
  } catch {
    /* DB unavailable */
  }

  return (
    <PageListingShell>
      <PageShell className="max-w-6xl">
        <MentorshipClient mentors={mentors} />
      </PageShell>
    </PageListingShell>
  );
}
