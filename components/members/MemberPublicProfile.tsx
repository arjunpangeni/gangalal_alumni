import type { ComponentType } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArticleCard } from "@/components/cards/ArticleCard";
import { buildCloudinaryUrl } from "@/lib/cloudinary-url";
import { cn, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  ExternalLink,
  GraduationCap,
  HeartHandshake,
  Mail,
  MapPin,
  Phone,
  User,
  FileText,
} from "lucide-react";

export type PublicMemberArticle = {
  title: string;
  slug: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  readTime?: number;
  createdAt: string;
};

export type PublicMemberData = {
  id: string;
  name: string;
  email: string;
  image?: string;
  joinedAt: string;
  profile: {
    bio?: string;
    slcSeeBatch?: number;
    schoolPeriod?: string;
    profession?: string;
    company?: string;
    permanentAddress?: string;
    city?: string;
    country?: string;
    linkedin?: string;
    facebook?: string;
    phone?: string;
  };
  availableForMentorship: boolean;
  mentorshipBio?: string;
  mentorshipSkills: string[];
};

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3 py-2.5 first:pt-0 last:pb-0">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/70 text-muted-foreground dark:bg-muted/50">
        <Icon className="size-4" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
        <p className="mt-0.5 text-sm font-medium leading-snug text-foreground">{value}</p>
      </div>
    </div>
  );
}

function shellCard(extra?: string) {
  return cn(
    "overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-card ring-1 ring-primary/[0.04] dark:border-border/45 dark:bg-card/90",
    extra
  );
}

export function MemberPublicProfile({
  member,
  articles,
  isLoggedIn,
}: {
  member: PublicMemberData;
  articles: PublicMemberArticle[];
  isLoggedIn: boolean;
}) {
  const p = member.profile;
  const imgLarge = member.image
    ? buildCloudinaryUrl(member.image, { width: 256, height: 256, crop: "fill", gravity: "face" })
    : "";
  const mailHref = `mailto:${member.email}?subject=${encodeURIComponent(`Alumni network — message for ${member.name}`)}`;

  const locationLine = [p.city, p.country].filter(Boolean).join(", ");
  const hasDetails =
    p.slcSeeBatch != null ||
    Boolean(p.schoolPeriod) ||
    Boolean(p.company) ||
    Boolean(p.profession) ||
    Boolean(locationLine) ||
    Boolean(p.permanentAddress) ||
    Boolean(p.phone);

  return (
    <div className="min-h-[60vh]">
      <div className="border-b border-border/60 bg-muted/20 dark:bg-muted/10">
        <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-10">
          <Link
            href="/members"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "-ml-2 mb-6 gap-1.5 text-muted-foreground hover:text-foreground"
            )}
          >
            <ArrowLeft className="size-4" aria-hidden />
            Member directory
          </Link>

          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
            <div
              className={cn(
                "flex shrink-0 items-center justify-center rounded-2xl bg-muted/80 p-2 dark:bg-muted/60",
                "ring-1 ring-border/40"
              )}
            >
              <Avatar className="size-24 border-2 border-border/60 sm:size-28 md:size-32">
                <AvatarImage src={imgLarge || member.image || ""} alt="" className="object-cover" />
                <AvatarFallback className="text-2xl font-semibold text-muted-foreground sm:text-3xl">
                  {member.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-balance text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                  {member.name}
                </h1>
                {member.availableForMentorship ? (
                  <Badge variant="secondary" className="gap-1 border-border/50 font-medium">
                    <HeartHandshake className="size-3.5 opacity-80" aria-hidden />
                    Open to mentoring
                  </Badge>
                ) : null}
              </div>
              {p.profession ? (
                <p className="mt-2 flex flex-wrap items-center justify-center gap-2 text-sm text-foreground sm:justify-start sm:text-base">
                  <Briefcase className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span>{p.profession}</span>
                  {p.company ? (
                    <span className="text-muted-foreground">
                      <span className="mx-1 text-border" aria-hidden>
                        ·
                      </span>
                      {p.company}
                    </span>
                  ) : null}
                </p>
              ) : p.company ? (
                <p className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground sm:justify-start sm:text-base">
                  <Building2 className="size-4 shrink-0" aria-hidden />
                  {p.company}
                </p>
              ) : null}
              <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-muted-foreground sm:justify-start">
                <Calendar className="size-4 shrink-0 opacity-80" aria-hidden />
                Member since {formatDate(member.joinedAt)}
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {isLoggedIn ? (
                  <a href={mailHref} className={cn(buttonVariants({ size: "default" }), "inline-flex gap-2")}>
                    <Mail className="size-4" aria-hidden />
                    Email
                  </a>
                ) : null}
                {p.linkedin ? (
                  <a
                    href={p.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ variant: "outline", size: "default" }), "gap-2")}
                  >
                    <ExternalLink className="size-4" aria-hidden />
                    LinkedIn
                  </a>
                ) : null}
                {p.facebook ? (
                  <a
                    href={p.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ variant: "outline", size: "default" }), "gap-2")}
                  >
                    <ExternalLink className="size-4" aria-hidden />
                    Facebook
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-6 lg:col-span-8">
            {p.bio ? (
              <Card className={shellCard()}>
                <CardHeader className="border-b border-border/60 bg-muted/25 pb-4 dark:bg-muted/15">
                  <div className="flex items-center gap-2 text-base font-bold text-foreground">
                    <User className="size-4 text-muted-foreground" aria-hidden />
                    About
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{p.bio}</p>
                </CardContent>
              </Card>
            ) : null}

            {member.availableForMentorship ? (
              <Card className={shellCard()}>
                <CardHeader className="border-b border-border/60 bg-muted/25 pb-4 dark:bg-muted/15">
                  <div className="flex items-center gap-2 text-base font-bold text-foreground">
                    <HeartHandshake className="size-4 text-muted-foreground" aria-hidden />
                    Mentorship
                  </div>
                  <p className="text-sm font-normal leading-relaxed text-muted-foreground">
                    Happy to help with guidance—reach out by email with a clear, polite note.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 pt-5">
                  {member.mentorshipBio ? (
                    <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{member.mentorshipBio}</p>
                  ) : null}
                  {member.mentorshipSkills && member.mentorshipSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {member.mentorshipSkills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="border-border/60 font-normal text-foreground dark:border-border/40"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  {isLoggedIn ? (
                    <a href={mailHref} className={cn(buttonVariants({ size: "default" }), "inline-flex w-full gap-2 sm:w-auto")}>
                      <Mail className="size-4" aria-hidden />
                      Email {member.name.split(" ")[0] ?? member.name}
                    </a>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}

            <div>
              <div className="mb-4 flex items-center gap-2">
                <FileText className="size-5 text-muted-foreground" aria-hidden />
                <h2 className="text-base font-bold text-foreground sm:text-lg">Published articles</h2>
              </div>
              {articles.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {articles.map((a) => (
                    <ArticleCard
                      key={a.slug}
                      title={a.title}
                      slug={a.slug}
                      excerpt={a.excerpt}
                      coverImage={a.coverImage}
                      tags={a.tags}
                      readTime={a.readTime}
                      authorName={member.name}
                      authorImage={member.image}
                      createdAt={a.createdAt}
                    />
                  ))}
                </div>
              ) : (
                <Card className={cn(shellCard(), "border-dashed py-12 text-center")}>
                  <FileText className="mx-auto size-10 text-muted-foreground/50" aria-hidden />
                  <p className="mt-3 text-sm font-medium text-foreground">No public articles yet</p>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                    When this member publishes stories on the site, they will show up here.
                  </p>
                </Card>
              )}
            </div>
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <Card className={cn(shellCard(), "lg:sticky lg:top-24")}>
              <CardHeader className="border-b border-border/60 bg-muted/25 pb-3 dark:bg-muted/15">
                <div className="text-base font-bold text-foreground">Profile details</div>
              </CardHeader>
              <CardContent className="divide-y divide-border/60 pt-1">
                {hasDetails ? (
                  <div className="divide-y divide-border/40">
                    {p.slcSeeBatch != null ? (
                      <DetailRow icon={GraduationCap} label="SLC / SEE batch" value={String(p.slcSeeBatch)} />
                    ) : null}
                    {p.schoolPeriod ? (
                      <DetailRow icon={GraduationCap} label="Years at school" value={p.schoolPeriod} />
                    ) : null}
                    {p.profession ? <DetailRow icon={Briefcase} label="Profession" value={p.profession} /> : null}
                    {p.company ? <DetailRow icon={Building2} label="Company" value={p.company} /> : null}
                    {locationLine ? <DetailRow icon={MapPin} label="Location" value={locationLine} /> : null}
                    {p.permanentAddress ? <DetailRow icon={MapPin} label="Address" value={p.permanentAddress} /> : null}
                    {isLoggedIn && p.phone ? <DetailRow icon={Phone} label="Phone" value={p.phone} /> : null}
                  </div>
                ) : (
                  <p className="py-6 text-center text-sm text-muted-foreground">No extra details listed.</p>
                )}

                {isLoggedIn ? (
                  <div className="pt-4">
                    <p className="text-xs text-muted-foreground sm:text-sm">Contact</p>
                    <a
                      href={mailHref}
                      className="mt-1 break-all text-sm font-medium text-primary underline-offset-2 hover:underline"
                    >
                      {member.email}
                    </a>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            {member.availableForMentorship ? (
              <Card className={shellCard()}>
                <CardContent className="pt-5 text-sm leading-relaxed text-muted-foreground">
                  <p>
                    Looking for more mentors?{" "}
                    <Link href="/mentorship" className="font-medium text-primary underline-offset-2 hover:underline">
                      Browse the mentorship page
                    </Link>
                    .
                  </p>
                </CardContent>
              </Card>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
