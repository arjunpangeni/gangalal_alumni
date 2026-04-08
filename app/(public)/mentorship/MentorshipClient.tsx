"use client";

import { useMemo, useState } from "react";
import { MentorCard } from "@/components/cards/MentorCard";
import { Input } from "@/components/ui/input";
import { PageEmptyState } from "@/components/layout/Page";
import { Search, X, HeartHandshake, Info } from "lucide-react";
import { searchTokens } from "@/lib/member-match";
import { useI18n } from "@/components/i18n/I18nProvider";

export interface MentorRow {
  _id: string;
  name: string;
  email: string;
  image?: string;
  profile?: { profession?: string; company?: string; city?: string; linkedin?: string };
  mentorshipBio?: string;
  mentorshipSkills?: string[];
}

function mentorMatchesQuery(m: MentorRow, tokens: string[]): boolean {
  if (tokens.length === 0) return true;
  const hay = [
    m.name,
    m.email,
    m.profile?.profession,
    m.profile?.company,
    m.profile?.city,
    m.mentorshipBio,
    ...(m.mentorshipSkills ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return tokens.every((t) => hay.includes(t));
}

export function MentorshipClient({ mentors }: { mentors: MentorRow[] }) {
  const { messages } = useI18n();
  const [search, setSearch] = useState("");
  const tokens = useMemo(() => searchTokens(search), [search]);
  const filtered = useMemo(() => mentors.filter((m) => mentorMatchesQuery(m, tokens)), [mentors, tokens]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 border-b border-border/50 pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pb-5 lg:pb-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl">{messages.nav.mentorship}</h1>
          <p className="mt-0.5 truncate text-xs leading-snug text-muted-foreground sm:text-sm">
            {messages.publicClients.mentorshipSubtitle}
            <span className="text-muted-foreground/80">
              {" "}
              · <span className="tabular-nums text-foreground/90">{filtered.length}</span>{" "}
              {filtered.length === 1 ? messages.publicClients.mentor : messages.publicClients.mentors}
              {search.trim() && mentors.length > 0 && filtered.length !== mentors.length ? (
                <span className="text-muted-foreground/70">
                  {" "}
                    (<span className="tabular-nums">{mentors.length}</span> {messages.publicClients.total})
                </span>
              ) : null}
            </span>
          </p>
        </div>
        <div className="relative w-full shrink-0 sm:max-w-[13.5rem]">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/75"
            aria-hidden
          />
          <Input
            placeholder={messages.publicClients.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 rounded-lg border-border/60 bg-background/90 py-2 pl-8 pr-14 text-sm shadow-sm transition-surface dark:bg-background/50"
            aria-label={messages.publicClients.searchMentors}
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-surface hover:bg-muted hover:text-foreground"
              aria-label={messages.publicClients.clearSearch}
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      <p
        className="flex gap-2.5 rounded-xl border border-primary/20 bg-primary/[0.06] px-3.5 py-3 text-sm leading-relaxed text-foreground/90 shadow-sm dark:border-primary/25 dark:bg-primary/[0.09] sm:px-4 sm:py-3.5"
        role="note"
      >
        <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <span>{messages.publicClients.becomeMentorHint}</span>
      </p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
        {filtered.map((m) => (
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

      {mentors.length === 0 ? (
        <PageEmptyState
          icon={<HeartHandshake className="size-10" />}
          title={messages.publicClients.noMentorsYet}
          description={messages.publicClients.noMentorsDesc}
        />
      ) : filtered.length === 0 ? (
        <PageEmptyState
          icon={<HeartHandshake className="size-10" />}
          title={messages.publicClients.noMentorsMatch}
          description={messages.publicClients.tryDifferentName}
        />
      ) : null}
    </div>
  );
}
