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
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/components/layout/Page";

export const dynamic = "force-dynamic";

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
  } catch { /* DB unavailable - show empty state */ }

  return (
    <>
      <HeroSection />
      <NoticeStrip notices={notices} />
      <StatsStrip stats={stats} />

      {/* Latest Articles */}
      <section className="border-t border-border/60 bg-background py-12 sm:py-16 dark:border-border/50">
        <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionHeader title="Latest articles" className="mb-1" />
            <p className="mt-1 max-w-lg text-sm text-muted-foreground sm:text-base">Stories and insights from the community</p>
          </div>
          <Link href="/articles" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 gap-1.5 self-start sm:self-auto")}>
            View all <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
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
      </section>

      {/* Upcoming Events */}
      <section className="border-t border-border/60 bg-muted/25 py-12 dark:bg-muted/15 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <SectionHeader title="Upcoming events" className="mb-1" />
              <p className="mt-1 max-w-lg text-sm text-muted-foreground sm:text-base">Reconnect at community gatherings</p>
            </div>
            <Link href="/events" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 gap-1.5 self-start sm:self-auto")}>
              View all <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
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
        </div>
      </section>

      {/* Featured Mentors */}
      <section className="border-t border-border/60 bg-background py-12 sm:py-16 dark:border-border/50">
        <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <SectionHeader title="Featured mentors" className="mb-1" />
            <p className="mt-1 max-w-lg text-sm text-muted-foreground sm:text-base">Learn from members open to mentoring</p>
          </div>
          <Link href="/mentorship" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0 gap-1.5 self-start sm:self-auto")}>
            View all <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
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
    </>
  );
}
