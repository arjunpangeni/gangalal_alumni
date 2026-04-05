"use client";

import { useMemo, useState } from "react";
import { MentorCard } from "@/components/cards/MentorCard";
import { Input } from "@/components/ui/input";
import { PageEmptyState } from "@/components/layout/Page";
import { Search, X, HeartHandshake } from "lucide-react";
import { searchTokens } from "@/lib/member-match";

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
  const [search, setSearch] = useState("");
  const tokens = useMemo(() => searchTokens(search), [search]);
  const filtered = useMemo(() => mentors.filter((m) => mentorMatchesQuery(m, tokens)), [mentors, tokens]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 border-b border-border/50 pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pb-5 lg:pb-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl">Mentorship</h1>
          <p className="mt-0.5 truncate text-xs leading-snug text-muted-foreground sm:text-sm">
            Verified alumni offering guidance—reach out by email and be clear about what you need.
            <span className="text-muted-foreground/80">
              {" "}
              · <span className="tabular-nums text-foreground/90">{filtered.length}</span>{" "}
              {filtered.length === 1 ? "mentor" : "mentors"}
              {search.trim() && mentors.length > 0 && filtered.length !== mentors.length ? (
                <span className="text-muted-foreground/70">
                  {" "}
                  (<span className="tabular-nums">{mentors.length}</span> total)
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
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 rounded-lg border-border/60 bg-background/90 py-2 pl-8 pr-14 text-sm shadow-sm transition-surface dark:bg-background/50"
            aria-label="Search mentors"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-surface hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>

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
          title="No mentors listed yet"
          description="When members enable mentorship in their dashboard, they will appear here with their email so you can get in touch."
        />
      ) : filtered.length === 0 ? (
        <PageEmptyState
          icon={<HeartHandshake className="size-10" />}
          title="No mentors match your search"
          description="Try a different name, skill, or location."
        />
      ) : null}
    </div>
  );
}
