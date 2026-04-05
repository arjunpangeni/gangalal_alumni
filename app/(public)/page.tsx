import connectDB from "@/lib/db";
import Article from "@/lib/models/Article";
import Event from "@/lib/models/Event";
import User from "@/lib/models/User";
import { HeroSection } from "@/components/home/HeroSection";
import { StatsStrip } from "@/components/home/StatsStrip";
import { NoticeStrip, type HomeNotice } from "@/components/home/NoticeStrip";
import Notice from "@/lib/models/Notice";
import { ArticleCard } from "@/components/cards/ArticleCard";
import { EventCard } from "@/components/cards/EventCard";
import { MentorCard } from "@/components/cards/MentorCard";
import { HomeExploreTiles } from "@/components/home/HomeExploreTiles";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
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
  "rounded-3xl border border-border/60 bg-card/60 shadow-card ring-1 ring-primary/[0.04] dark:border-border/50 dark:bg-card/50 sm:rounded-[1.75rem]";

function SectionTitle({
  title,
  subtitle,
  href,
  linkLabel,
}: {
  title: string;
  subtitle: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <Link href={href} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 gap-1.5 self-start sm:self-auto")}>
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
    { label: "Members", value: 0 },
    { label: "Articles Published", value: 0 },
    { label: "Events Hosted", value: 0 },
    { label: "Mentors Available", value: 0 },
  ];

  try {
    await connectDB();

    const [articlesData, eventsData, mentorsData, noticesData, memberCount, articleCount, eventCount, mentorCount] = await Promise.all([
      Article.find({ status: "published", deletedAt: null })
        .sort({ createdAt: -1 })
        .limit(6)
        .populate("authorId", "name image")
        .select("title slug excerpt coverImage tags readTime createdAt authorId")
        .lean(),
      Event.find({ status: "published", deletedAt: null })
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
        const now = new Date();
        return Notice.find({
          isActive: true,
          deletedAt: null,
          $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
        })
          .sort({ sortOrder: -1, createdAt: -1 })
          .limit(6)
          .select("title body linkUrl linkLabel expiresAt")
          .lean();
      })(),
      User.countDocuments({ status: "approved" }),
      Article.countDocuments({ status: "published", deletedAt: null }),
      Event.countDocuments({ status: "published" }),
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
      { label: "Members", value: memberCount },
      { label: "Articles Published", value: articleCount },
      { label: "Events Hosted", value: eventCount },
      { label: "Mentors Available", value: mentorCount },
    ];
  } catch {
    /* DB unavailable */
  }

  const hasNotices = notices.length > 0;

  return (
    <div className="min-h-screen">
      {/* Hero first; notices sit in a separate panel below when present */}
      <section className="relative overflow-visible bg-gradient-to-b from-background via-background to-muted/25 pb-6 dark:to-muted/10 sm:pb-8">
        <div
          className={cn(
            "relative mx-3 mt-3 overflow-hidden rounded-[1.75rem] border border-border/50 shadow-[0_4px_24px_oklch(0.35_0.08_264/0.08)] dark:border-border/40 sm:mx-4 sm:mt-4 sm:rounded-[2rem] md:mx-6 md:rounded-[2.25rem] lg:mx-auto lg:mt-5 lg:max-w-7xl"
          )}
        >
          <HeroSection className="rounded-[inherit] py-16 md:py-20 lg:py-24" />
        </div>

        {hasNotices ? (
          <div className="mx-auto mt-5 max-w-7xl px-3 sm:mt-6 sm:px-4 md:px-6 lg:px-3">
            <div className={cn(panel, "p-4 sm:p-5 md:p-6")}>
              <NoticeStrip notices={notices} embedded />
            </div>
          </div>
        ) : null}

        {/* Explore */}
        <div className="relative z-10 mx-auto mt-5 max-w-7xl px-3 sm:mt-6 sm:px-4 md:px-6 lg:px-3">
          <div className={cn(panel, "p-4 sm:p-5 md:p-6")}>
            <HomeExploreTiles />
          </div>
        </div>
      </section>

      {/* Stats in rounded shell */}
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-4 md:px-6 lg:px-3 lg:py-8">
        <div className={cn(panel, "overflow-hidden p-4 sm:p-5 md:p-6")}>
          <StatsStrip stats={stats} bare />
        </div>
      </div>

      {/* Articles + events bento */}
      <section className="mx-auto max-w-7xl px-3 pb-10 sm:px-4 md:px-6 lg:px-3 lg:pb-12">
        <div className={cn(panel, "p-4 sm:p-5 md:p-6 lg:p-8")}>
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-8 xl:gap-10">
            <div className="lg:col-span-8">
              <SectionTitle
                title="Latest articles"
                subtitle="Articles and opinions from verified members."
                href="/articles"
                linkLabel="View all"
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                {articles.map((a) => (
                  <ArticleCard
                    key={String(a._id)}
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
            <aside className="rounded-2xl border border-border/40 bg-muted/20 p-4 dark:border-border/30 dark:bg-muted/15 sm:rounded-3xl sm:p-5 lg:col-span-4">
              <SectionTitle
                title="Upcoming events"
                subtitle="Workshops, reunions, and meetups."
                href="/events"
                linkLabel="All events"
              />
              <div className="flex flex-col gap-4">
                {events.map((e) => (
                  <EventCard
                    key={String(e._id)}
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
            </aside>
          </div>
        </div>
      </section>

      {/* Mentors */}
      <section className="mx-auto max-w-7xl px-3 pb-12 sm:px-4 md:px-6 lg:px-3 lg:pb-16">
        <div className={cn(panel, "bg-muted/25 p-4 dark:bg-muted/20 sm:p-5 md:p-6 lg:p-8")}>
          <SectionTitle
            title="Featured mentors"
            subtitle="Members open to mentoring—reach out by email."
            href="/mentorship"
            linkLabel="Find a mentor"
          />
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:gap-4 lg:grid-cols-4">
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
          </div>
        </div>
      </section>
    </div>
  );
}
