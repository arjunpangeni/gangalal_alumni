import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { MentorCard } from "@/components/cards/MentorCard";
import type { Metadata } from "next";
import { HeartHandshake, Mail } from "lucide-react";
import { PageShell, PageHeader, PageEmptyState } from "@/components/layout/Page";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Mentorship",
  description: "Connect with alumni mentors by email.",
};
export const dynamic = "force-dynamic";

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
    mentors = (await User.find({ status: "approved", availableForMentorship: true })
      .sort({ createdAt: -1 })
      .select("name email image profile mentorshipBio mentorshipSkills")
      .lean()) as unknown as UserDoc[];
  } catch {
    /* DB unavailable */
  }

  return (
    <PageShell className="max-w-6xl">
      <PageHeader
        title="Find a mentor"
        description="Browse alumni who are open to mentoring. Each card includes their email so you can introduce yourself and ask for guidance."
        className="sm:mb-10"
      />

      <Card className="mb-8 border-gray-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-900 sm:mb-10">
        <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-start sm:gap-4 sm:pt-6">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary dark:bg-primary/20 dark:text-primary">
            <Mail className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 space-y-2 text-sm leading-relaxed sm:text-[15px]">
            <p className="font-semibold text-black dark:text-white">How to connect</p>
            <p className="text-gray-700 dark:text-gray-300">
              Mentors listed here have chosen to share their contact details. Use the <strong className="text-black dark:text-white">email</strong>{" "}
              on each card or the <strong className="text-black dark:text-white">Email</strong> button to open your mail app with a suggested
              subject line. Be clear and respectful about what you are looking for—career advice, study tips, or industry
              insights.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
        {mentors.map((m) => (
          <MentorCard
            key={String(m._id)}
            userId={String(m._id)}
            name={m.name}
            email={m.email}
            image={m.image}
            profession={m.profile?.profession}
            company={m.profile?.company}
            city={m.profile?.city}
            linkedin={m.profile?.linkedin}
            mentorshipBio={m.mentorshipBio}
            mentorshipSkills={m.mentorshipSkills}
          />
        ))}
        {mentors.length === 0 ? (
          <div className="col-span-full">
            <PageEmptyState
              icon={<HeartHandshake className="size-10" />}
              title="No mentors listed yet"
              description="When members enable mentorship in their dashboard, they will appear here with their email so you can get in touch."
            />
          </div>
        ) : null}
      </div>
    </PageShell>
  );
}
