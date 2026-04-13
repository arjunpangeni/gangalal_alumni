"use client";

import { PageShell } from "@/components/layout/Page";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { PublicCommitteeRow } from "@/lib/server/committee";

type AboutPageClientProps = {
  committee: PublicCommitteeRow[];
};

export function AboutPageClient({ committee }: AboutPageClientProps) {
  const { messages } = useI18n();
  const about = messages.aboutPage;

  return (
    <PageShell className="articles-typography max-w-4xl">
      <article className="space-y-10 text-foreground">
        <header className="space-y-3 border-b border-border/70 pb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary/90">{about.schoolLabel}</p>
          <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{about.title}</h1>
        </header>

        <section className="article-body space-y-5 text-[1.02rem] leading-8 text-foreground/95 sm:text-[1.08rem]">
          <h2 className="text-2xl font-semibold">{about.establishedTitle}</h2>
          <p>{about.establishedBody}</p>

          <h2 className="pt-1 text-2xl font-semibold">{about.namingTitle}</h2>
          <p>{about.namingBody}</p>

          <h2 className="pt-1 text-2xl font-semibold">{about.leadershipTitle}</h2>
          <p>{about.leadershipBody}</p>

          <h2 className="pt-1 text-2xl font-semibold">{about.achievementTitle}</h2>
          <p>{about.achievementBody}</p>

          <h2 className="pt-1 text-2xl font-semibold">{about.infrastructureTitle}</h2>
          <p>{about.infrastructureBody}</p>
        </section>

        <section className="space-y-4 border-t border-border/70 pt-8">
          <h2 className="text-2xl font-semibold">{about.forumTitle}</h2>
          <h3 className="text-xl font-semibold">{about.forumBackgroundTitle}</h3>
          <p className="article-body text-[1.02rem] leading-8 text-foreground/95 sm:text-[1.08rem]">
            {about.forumBackgroundBody}
          </p>
          <h3 className="text-xl font-semibold">{about.objectivesTitle}</h3>
          <ul className="article-body list-disc space-y-2 pl-5 text-[1.02rem] leading-8 text-foreground/95 sm:text-[1.08rem]">
            {about.objectives.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="space-y-4 border-t border-border/70 pt-8">
          <h2 className="text-2xl font-semibold">{about.worksTitle}</h2>
          <ol className="article-body list-decimal space-y-3 pl-5 text-[1.02rem] leading-8 text-foreground/95 sm:text-[1.08rem]">
            {about.works.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </section>

        {committee.length > 0 ? (
          <section className="space-y-4 border-t border-border/70 pt-8">
            <h2 className="text-2xl font-semibold text-foreground">{about.committeeTitle}</h2>
            <p className="text-sm text-muted-foreground">{about.committeeSubtitle}</p>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {committee.map((member) => (
                <li
                  key={member._id}
                  className="flex flex-col items-center rounded-xl border border-border/70 bg-background p-4 text-center"
                >
                  <Avatar className="size-24 shrink-0 border border-border">
                    {member.photo ? <AvatarImage src={member.photo} alt="" className="object-cover" /> : null}
                    <AvatarFallback className="text-lg font-medium">{member.name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <p className="mt-3 font-semibold text-foreground">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.post}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    </PageShell>
  );
}
