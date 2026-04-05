"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { buildCloudinaryUrl } from "@/lib/cloudinary-url";
import { Building2, ChevronDown, ChevronUp, Mail, MapPin, UserRound, ExternalLink } from "lucide-react";
import Link from "next/link";

const BIO_COLLAPSE_CHARS = 96;

interface MentorCardProps {
  name: string;
  email: string;
  image?: string;
  profession?: string;
  company?: string;
  city?: string;
  mentorshipBio?: string;
  mentorshipSkills?: string[];
  linkedin?: string;
  userId: string;
}

export function MentorCard({
  name,
  email,
  image,
  profession,
  company,
  city,
  mentorshipBio,
  mentorshipSkills,
  linkedin,
  userId,
}: MentorCardProps) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const imgSrc = image ? buildCloudinaryUrl(image, { width: 88, height: 88, crop: "fill", gravity: "face" }) : "";
  const mailHref = `mailto:${email}?subject=${encodeURIComponent(`Mentorship inquiry – ${name}`)}`;
  const bio = mentorshipBio?.trim() ?? "";
  const bioNeedsToggle = bio.length > BIO_COLLAPSE_CHARS;

  return (
    <article
      className={cn(
        "group/card flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/95 text-sm shadow-card ring-1 ring-primary/[0.05] transition-surface",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_10px_28px_oklch(0.35_0.1_264/0.1)]",
        "dark:border-border/45 dark:bg-card/90"
      )}
    >
      <div className="border-b border-border/50 bg-muted/30 px-3 pb-3 pt-3.5 dark:bg-muted/20">
        <div className="flex items-start gap-2.5">
          <Avatar className="size-10 shrink-0 ring-2 ring-border/50 transition-surface group-hover/card:ring-primary/35">
            <AvatarImage src={imgSrc || image || ""} alt="" />
            <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">{name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="font-heading text-sm font-semibold leading-tight tracking-tight text-foreground">{name}</h3>
            {profession ? <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{profession}</p> : null}
            <div className="mt-1.5 flex flex-col gap-0.5 text-[11px] text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-3">
              {company ? (
                <span className="inline-flex min-w-0 items-center gap-1">
                  <Building2 className="size-3 shrink-0 opacity-80" aria-hidden />
                  <span className="truncate">{company}</span>
                </span>
              ) : null}
              {city ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3 shrink-0 opacity-80" aria-hidden />
                  <span className="line-clamp-1">{city}</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 px-3 py-3">
        <div className="rounded-xl border border-primary/18 bg-primary/[0.05] px-2.5 py-2 dark:border-primary/22 dark:bg-primary/[0.08]">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            <Mail className="size-3 shrink-0" aria-hidden />
            Email
          </p>
          <a
            href={mailHref}
            className="mt-1 block truncate text-xs font-semibold text-primary underline decoration-primary/30 underline-offset-2 transition-surface hover:decoration-primary"
          >
            {email}
          </a>
        </div>

        {bio ? (
          <div className="min-h-0">
            <p
              className={cn(
                "text-xs leading-relaxed text-muted-foreground",
                !bioExpanded && bioNeedsToggle && "line-clamp-2"
              )}
            >
              {bio}
            </p>
            {bioNeedsToggle ? (
              <button
                type="button"
                onClick={() => setBioExpanded((v) => !v)}
                aria-expanded={bioExpanded}
                className="mt-1 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-xs font-medium text-primary transition-surface hover:bg-primary/10"
              >
                {bioExpanded ? (
                  <>
                    Show less
                    <ChevronUp className="size-3.5 shrink-0" aria-hidden />
                  </>
                ) : (
                  <>
                    Read full bio
                    <ChevronDown className="size-3.5 shrink-0" aria-hidden />
                  </>
                )}
              </button>
            ) : null}
          </div>
        ) : null}

        {mentorshipSkills && mentorshipSkills.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {mentorshipSkills.slice(0, 5).map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="border-border/50 bg-muted/45 px-1.5 py-0 text-[10px] font-normal leading-tight text-foreground dark:border-border/40"
              >
                {skill}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex flex-col gap-1.5 pt-0.5 sm:flex-row sm:flex-wrap">
          <a
            href={mailHref}
            className={cn(
              buttonVariants({ size: "sm" }),
              "h-9 w-full justify-center gap-1.5 border-0 bg-gradient-to-br from-primary to-indigo-600 text-primary-foreground shadow-sm transition-surface hover:opacity-[0.96] sm:flex-1"
            )}
          >
            <Mail className="size-3.5 shrink-0" />
            Email
          </a>
          <Link
            href={`/members/${userId}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-9 w-full justify-center gap-1.5 transition-surface sm:w-auto sm:flex-1"
            )}
          >
            <UserRound className="size-3.5 shrink-0" aria-hidden />
            Profile
          </Link>
          {linkedin ? (
            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-9 w-full justify-center gap-1.5 transition-surface sm:w-auto"
              )}
            >
              <ExternalLink className="size-3.5 shrink-0" />
              LinkedIn
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
