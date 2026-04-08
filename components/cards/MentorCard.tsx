"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { buildCloudinaryUrl } from "@/lib/cloudinary-url";
import { Building2, ChevronDown, ChevronUp, Mail, MapPin, UserRound, ExternalLink } from "lucide-react";
import Link from "next/link";

const BIO_COLLAPSE_CHARS = 140;

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
  /** Tighter layout for homepage */
  compact?: boolean;
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
  compact = false,
}: MentorCardProps) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const avatarPx = compact ? 48 : 56;
  const imgSrc = image
    ? buildCloudinaryUrl(image, { width: avatarPx, height: avatarPx, crop: "fill", gravity: "face" })
    : "";
  const mailHref = `mailto:${email}?subject=${encodeURIComponent(`Mentorship inquiry – ${name}`)}`;
  const bio = mentorshipBio?.trim() ?? "";
  const bioNeedsToggle = bio.length > BIO_COLLAPSE_CHARS;

  return (
    <article
      className={cn(
        "flex h-full flex-col gap-4 rounded-2xl border border-border/60 bg-card/95 shadow-card ring-1 ring-primary/[0.04] transition-surface",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_12px_40px_oklch(0.35_0.1_264/0.12)] dark:border-border/45 dark:bg-card/90",
        compact ? "p-4 sm:p-4" : "p-5 sm:flex-row sm:items-start sm:gap-5 sm:p-6 sm:rounded-3xl"
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-2xl bg-muted/80 dark:bg-muted/60",
          compact ? "size-12 sm:size-12" : "size-14 sm:size-16"
        )}
      >
        <Avatar
          className={cn(
            "ring-2 ring-border/40",
            compact ? "size-10" : "size-12 sm:size-14"
          )}
        >
          <AvatarImage src={imgSrc || image || ""} alt="" />
          <AvatarFallback
            className={cn(
              "bg-muted text-sm font-semibold text-muted-foreground",
              compact ? "text-xs" : "text-sm"
            )}
          >
            {name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="min-w-0 flex-1 flex flex-col gap-3">
        <div>
          <h3
            className={cn(
              "font-bold leading-tight text-foreground",
              compact ? "text-sm sm:text-base" : "text-base sm:text-lg"
            )}
          >
            {name}
          </h3>
          {profession ? (
            <p className={cn("mt-1 text-sm text-muted-foreground", compact && "text-xs sm:text-sm")}>
              {profession}
            </p>
          ) : null}
          <div
            className={cn(
              "mt-2 flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-1",
              compact && "text-xs sm:text-sm"
            )}
          >
            {company ? (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <Building2 className="size-3.5 shrink-0 opacity-80" aria-hidden />
                <span className="truncate">{company}</span>
              </span>
            ) : null}
            {city ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0 opacity-80" aria-hidden />
                <span className="line-clamp-1">{city}</span>
              </span>
            ) : null}
          </div>
        </div>

        <a
          href={mailHref}
          className={cn(
            "inline-flex w-max max-w-full items-center gap-2 rounded-md text-sm font-medium text-primary underline-offset-4 transition-colors hover:underline",
            compact && "text-xs sm:text-sm"
          )}
        >
          <Mail className="size-3.5 shrink-0 opacity-90" aria-hidden />
          <span className="truncate">{email}</span>
        </a>

        {bio ? (
          <div className="min-h-0">
            <p
              className={cn(
                "text-sm leading-relaxed text-muted-foreground",
                compact && "text-xs sm:text-sm",
                !bioExpanded && bioNeedsToggle && "line-clamp-3"
              )}
            >
              {bio}
            </p>
            {bioNeedsToggle && !compact ? (
              <button
                type="button"
                onClick={() => setBioExpanded((v) => !v)}
                aria-expanded={bioExpanded}
                className="mt-1.5 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {bioExpanded ? (
                  <>
                    Show less
                    <ChevronUp className="size-4 shrink-0" aria-hidden />
                  </>
                ) : (
                  <>
                    Read full bio
                    <ChevronDown className="size-4 shrink-0" aria-hidden />
                  </>
                )}
              </button>
            ) : null}
          </div>
        ) : null}

        {mentorshipSkills && mentorshipSkills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {mentorshipSkills.slice(0, compact ? 4 : 6).map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className={cn(
                  "border-border/60 font-normal text-foreground dark:border-border/40",
                  compact ? "px-2 py-0 text-xs" : "text-xs font-medium"
                )}
              >
                {skill}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap">
          <a
            href={mailHref}
            className={cn(
              buttonVariants({ size: "sm" }),
              "w-full justify-center gap-1.5 sm:w-auto sm:flex-1"
            )}
          >
            <Mail className="size-3.5" />
            Email
          </a>
          <Link
            href={`/members/${userId}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-full justify-center gap-1.5 sm:w-auto sm:flex-1"
            )}
          >
            <UserRound className="size-3.5" aria-hidden />
            Profile
          </Link>
          {linkedin ? (
            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full justify-center gap-1.5 sm:w-auto")}
            >
              <ExternalLink className="size-3.5" />
              LinkedIn
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
