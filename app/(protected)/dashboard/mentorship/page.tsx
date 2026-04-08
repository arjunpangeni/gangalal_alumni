import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { MentorshipToggle } from "./MentorshipToggle";
import { PageShell, PageHeader } from "@/components/layout/Page";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { I18nText } from "@/components/i18n/I18nText";

export const unstable_dynamicStaleTime = 30;

export default async function DashboardMentorshipPage() {
  const session = await auth();
  await connectDB();
  const user = (await User.findById(session!.user!.id)
    .select("availableForMentorship mentorshipBio mentorshipSkills")
    .lean()) as { availableForMentorship: boolean; mentorshipBio?: string; mentorshipSkills?: string[] } | null;

  return (
    <PageShell className="max-w-2xl space-y-6 px-0">
      <PageHeader
        title={<I18nText id="dashboard.mentorship" fallback="Mentorship" />}
        description={<I18nText id="dashboard.offerGuidance" fallback="Offer guidance" />}
        className="mb-0"
      />

      <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.06] via-card to-card shadow-sm ring-1 ring-emerald-500/10 dark:from-emerald-500/[0.09]">
        <CardContent className="flex gap-3 pt-5 sm:pt-6">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background/90 ring-1 ring-border shadow-sm">
            <Sparkles className="size-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
          </div>
          <div className="min-w-0 space-y-1 text-sm leading-relaxed">
            <p className="font-medium text-foreground"><I18nText id="dashboard.howItWorks" fallback="How it works" /></p>
            <p className="text-muted-foreground">
              Turn on <strong className="text-foreground">Available as a mentor</strong>, write a short introduction, add topics
              you can help with, and save. Your listing uses the same name, photo, and work details as your public member profile,
              plus the email on your account for contact.
            </p>
          </div>
        </CardContent>
      </Card>

      <MentorshipToggle
        initial={{
          availableForMentorship: user?.availableForMentorship ?? false,
          mentorshipBio: user?.mentorshipBio ?? "",
          mentorshipSkills: user?.mentorshipSkills ?? [],
        }}
      />
    </PageShell>
  );
}
