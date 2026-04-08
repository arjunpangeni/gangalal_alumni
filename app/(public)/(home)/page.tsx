import connectDB from "@/lib/db";
import Article from "@/lib/models/Article";
import Event from "@/lib/models/Event";
import { purgeExpiredEvents } from "@/lib/server/purge-expired-events";
import User from "@/lib/models/User";
import { HeroSection } from "@/components/home/HeroSection";
import { StatsStrip } from "@/components/home/StatsStrip";
import { NoticeStrip, type HomeNotice } from "@/components/home/NoticeStrip";
import Notice from "@/lib/models/Notice";
import { ArticleCard } from "@/components/cards/ArticleCard";
import { EventCard } from "@/components/cards/EventCard";
import { MentorCard } from "@/components/cards/MentorCard";
import { HomeExploreTiles } from "@/components/home/HomeExploreTiles";
import { HomeFadeIn } from "@/components/home/HomeFadeIn";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { I18nText } from "@/components/i18n/I18nText";
export const revalidate = 60;

interface ArticleDoc {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  readTime?: number;
  createdAt: string;
  authorId?: { name: string; image?: string };
}

interface EventDoc {
  _id: string;
  title: string;
  slug: string;
  description: string;
  startDate: string;
  venue: string;
  capacity?: number;
  tags?: string[];
}

interface UserDoc {
  _id: string;
  name: string;
  email: string;
  image?: string;
  profile?: { profession?: string; company?: string; city?: string; linkedin?: string };
  mentorshipBio?: string;
  mentorshipSkills?: string[];
}

const panel =
  "rounded-xl border border-border/50 bg-card/80 shadow-sm ring-1 ring-primary/[0.02] backdrop-blur-[2px] dark:border-border/45 dark:bg-card/50 sm:rounded-2xl";

function SectionTitle({
  title,
  subtitle,
  href,
  linkLabel,
}: {
  title: ReactNode;
  subtitle: ReactNode;
  href: string;
  linkLabel: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <h2 className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-muted-foreground sm:mt-2.5 sm:text-base sm:leading-relaxed">{subtitle}</p>
      </div>
      <Link
        href={href}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "shrink-0 gap-1.5 self-start text-[13px] sm:self-auto sm:text-sm"
        )}
      >
        {linkLabel} <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </div>
  );
}

export default async function HomePage() {
  let articles: ArticleDoc[] = [];
  let events: EventDoc[] = [];
  let mentors: UserDoc[] = [];
  let notices: HomeNotice[] = [];
  let stats = [
    { label: "Members", labelId: "home.members", value: 0 },
    { label: "Articles Published", labelId: "home.articlesPublished", value: 0 },
    { label: "Events Hosted", labelId: "home.eventsHosted", value: 0 },
    { label: "Mentors Available", labelId: "home.mentorsAvailable", value: 0 },
  ];

  try {
    await connectDB();
    await purgeExpiredEvents();

    const now = new Date();
    const [articlesData, eventsData, mentorsData, noticesData, memberCount, articleCount, eventCount, mentorCount] = await Promise.all([
      Article.find({ status: "published", deletedAt: null })
        .sort({ createdAt: -1 })
        .limit(6)
        .populate("authorId", "name image")
        .select("title slug excerpt coverImage tags readTime createdAt authorId")
        .lean(),
      Event.find({ status: "published", deletedAt: null, endDate: { $gte: now } })
        .sort({ startDate: 1 })
        .limit(4)
        .select("title slug description startDate venue capacity tags")
        .lean(),
      User.find({ status: "approved", availableForMentorship: true })
        .sort({ createdAt: -1 })
        .limit(4)
        .select("name email image profile mentorshipBio mentorshipSkills")
        .lean(),
      (async () => {
        return Notice.find({
          isActive: true,
          deletedAt: null,
          $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
        })
          .sort({ sortOrder: -1, createdAt: -1 })
          .limit(6)
          .select("title body linkUrl linkLabel expiresAt")
          .lean();
      })(),
      User.countDocuments({ status: "approved" }),
      Article.countDocuments({ status: "published", deletedAt: null }),
      Event.countDocuments({ status: "published", deletedAt: null, endDate: { $gte: now } }),
      User.countDocuments({ status: "approved", availableForMentorship: true }),
    ]);

    articles = articlesData as unknown as ArticleDoc[];
    events = eventsData as unknown as EventDoc[];
    mentors = mentorsData as unknown as UserDoc[];
    notices = (noticesData as { _id: unknown; title: string; body: string; linkUrl?: string; linkLabel?: string; expiresAt?: Date }[]).map(
      (n) => ({
        _id: String(n._id),
        title: n.title,
        body: n.body,
        linkUrl: n.linkUrl,
        linkLabel: n.linkLabel,
        expiresAt: n.expiresAt,
      })
    );
    stats = [
      { label: "Members", labelId: "home.members", value: memberCount },
      { label: "Articles Published", labelId: "home.articlesPublished", value: articleCount },
      { label: "Events Hosted", labelId: "home.eventsHosted", value: eventCount },
      { label: "Mentors Available", labelId: "home.mentorsAvailable", value: mentorCount },
    ];
  } catch {
    /* DB unavailable */
  }

  const hasNotices = notices.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 dark:to-muted/10">
      <HeroSection className="w-full" />

      <section className="relative z-10 -mt-2 space-y-6 px-4 pb-10 sm:-mt-3 sm:space-y-8 sm:px-6 sm:pb-12 md:px-8 lg:mx-auto lg:max-w-7xl lg:px-6 lg:pb-16">
        {hasNotices ? (
          <HomeFadeIn>
            <div className={cn(panel, "p-4 sm:p-5")}>
              <NoticeStrip notices={notices} embedded />
            </div>
          </HomeFadeIn>
        ) : null}

        <HomeFadeIn delay={hasNotices ? 0.06 : 0}>
          <div className={cn(panel, "p-5 sm:p-6 md:p-7")}>
            <HomeExploreTiles />
          </div>
        </HomeFadeIn>

        <HomeFadeIn delay={0.08}>
          <div className={cn(panel, "overflow-hidden p-5 sm:p-6 md:p-7")}>
            <StatsStrip stats={stats} bare className="gap-4 sm:gap-5 md:gap-6" />
          </div>
        </HomeFadeIn>

        <HomeFadeIn delay={0.1}>
          <div className={cn(panel, "p-5 sm:p-6 md:p-7 lg:p-8")}>
            <div className="grid gap-9 lg:grid-cols-12 lg:gap-8 xl:gap-10">
              <div className="lg:col-span-8">
                <SectionTitle
                  title={<I18nText id="home.latestArticlesTitle" fallback="Latest articles" />}
                  subtitle={<I18nText id="home.latestArticlesSubtitle" fallback="Articles and opinions from verified members." />}
                  href="/articles"
                  linkLabel={<I18nText id="home.viewAll" fallback="View all" />}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
                  {articles.map((a) => (
                    <ArticleCard
                      key={String(a._id)}
                      variant="compact"
                      editorial
                      title={a.title}
                      slug={a.slug}
                      excerpt={a.excerpt}
                      coverImage={a.coverImage}
                      tags={a.tags}
                      readTime={a.readTime}
                      authorName={a.authorId?.name}
                      authorImage={a.authorId?.image}
                      createdAt={a.createdAt}
                    />
                  ))}
                </div>
              </div>
              <aside className="rounded-xl border border-border/40 bg-muted/20 p-5 dark:border-border/30 dark:bg-muted/12 sm:p-6 lg:col-span-4">
                <SectionTitle
                  title={<I18nText id="home.upcomingEventsTitle" fallback="Upcoming events" />}
                  subtitle={<I18nText id="home.upcomingEventsSubtitle" fallback="Workshops, reunions, and meetups." />}
                  href="/events"
                  linkLabel={<I18nText id="home.allEvents" fallback="All events" />}
                />
                {events.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 px-4 py-8 text-center dark:border-border/45 dark:bg-muted/20">
                    <p className="text-sm font-semibold text-foreground">
                      <I18nText id="publicClients.noEventsAvailable" fallback="No events available" />
                    </p>
                    <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground sm:text-sm">
                      <I18nText
                        id="publicClients.noEventsAvailableDesc"
                        fallback="There are no programs listed right now. Check back later."
                      />
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {events.map((e) => (
                      <EventCard
                        key={String(e._id)}
                        variant="compact"
                        editorial
                        title={e.title}
                        slug={e.slug}
                        description={e.description}
                        startDate={e.startDate}
                        venue={e.venue}
                        capacity={e.capacity}
                        tags={e.tags}
                      />
                    ))}
                  </div>
                )}
              </aside>
            </div>
          </div>
        </HomeFadeIn>

        <HomeFadeIn delay={0.12}>
          <div className={cn(panel, "bg-muted/15 p-5 dark:bg-muted/12 sm:p-6 md:p-7 lg:p-8")}>
            <SectionTitle
              title={<I18nText id="home.featuredMentorsTitle" fallback="Featured mentors" />}
              subtitle={<I18nText id="home.featuredMentorsSubtitle" fallback="Members open to mentoring-reach out by email." />}
              href="/mentorship"
              linkLabel={<I18nText id="home.findMentor" fallback="Find a mentor" />}
            />
            <div className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 sm:gap-4 lg:grid-cols-4">
              {mentors.map((m) => (
                <MentorCard
                  key={String(m._id)}
                  compact
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
            </div>
          </div>
        </HomeFadeIn>
      </section>
    </div>
  );
}
