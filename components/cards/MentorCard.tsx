import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { buildCloudinaryUrl } from "@/lib/cloudinary-url";
import { Building2, Mail, MapPin, UserRound, ExternalLink } from "lucide-react";
import Link from "next/link";

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
  const imgSrc = image ? buildCloudinaryUrl(image, { width: 112, height: 112, crop: "fill", gravity: "face" }) : "";
  const mailHref = `mailto:${email}?subject=${encodeURIComponent(`Mentorship inquiry – ${name}`)}`;

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-md transition-all duration-200 hover:shadow-lg",
        "dark:border-gray-700 dark:bg-gray-900 dark:hover:shadow-lg"
      )}
    >
      <div className="border-b border-gray-200 bg-gray-50 px-4 pb-4 pt-5 dark:border-gray-700 dark:bg-gray-800 sm:px-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <Avatar className="size-14 shrink-0 ring-2 ring-gray-300 dark:ring-gray-600 sm:size-16">
            <AvatarImage src={imgSrc || image || ""} alt={name} />
            <AvatarFallback className="bg-gray-200 text-lg font-bold text-gray-700 dark:bg-gray-700 dark:text-gray-200">{name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold leading-tight tracking-tight text-black dark:text-white sm:text-lg">{name}</h3>
            {profession ? (
              <p className="mt-0.5 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">{profession}</p>
            ) : null}
            <div className="mt-2 flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-400 sm:flex-row sm:flex-wrap sm:gap-x-4">
              {company ? (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="size-3.5 shrink-0" aria-hidden />
                  <span className="line-clamp-1">{company}</span>
                </span>
              ) : null}
              {city ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5 shrink-0" aria-hidden />
                  {city}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-4 py-4 sm:px-5 sm:py-5">
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-3 dark:border-blue-900 dark:bg-blue-950">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-900 dark:text-blue-100">
            <Mail className="size-3.5 shrink-0" aria-hidden />
            Connect by email
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-blue-950 dark:text-blue-50">
            Reach out to <span className="font-semibold">{name}</span> using the address below. Introduce yourself
            and what you would like help with.
          </p>
          <a
            href={mailHref}
            className="mt-2 inline-flex max-w-full items-center gap-2 break-all text-sm font-semibold text-blue-900 underline decoration-blue-600/40 underline-offset-2 hover:text-blue-950 hover:decoration-blue-700 dark:text-blue-100 dark:decoration-blue-400/50 dark:hover:text-blue-50"
          >
            {email}
          </a>
        </div>

        {mentorshipBio ? (
          <p className="line-clamp-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300 sm:line-clamp-5">
            {mentorshipBio}
          </p>
        ) : null}

        {mentorshipSkills && mentorshipSkills.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {mentorshipSkills.slice(0, 8).map((skill) => (
              <Badge
                key={skill}
                variant="secondary"
                className="border-gray-300 bg-gray-100 text-xs font-normal text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
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
              buttonVariants({ size: "default" }),
              "min-h-11 w-full justify-center gap-2 gradient-primary border-0 text-white sm:flex-1"
            )}
          >
            <Mail className="size-4 shrink-0" />
            Email {name.split(" ")[0] ?? name}
          </a>
          <Link
            href={`/members/${userId}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "min-h-11 w-full justify-center gap-2 border-gray-300 bg-white text-black hover:bg-gray-100 sm:w-auto sm:flex-1 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
            )}
          >
            <UserRound className="size-4 shrink-0" aria-hidden />
            View profile
          </Link>
          {linkedin ? (
            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "min-h-11 w-full justify-center gap-2 border-gray-300 bg-white text-black hover:bg-gray-100 sm:w-auto dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
              )}
            >
              <ExternalLink className="size-4 shrink-0" />
              LinkedIn
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
