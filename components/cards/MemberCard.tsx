import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, MapPin, GraduationCap } from "lucide-react";
import { buildCloudinaryUrl } from "@/lib/cloudinary-url";

interface MemberCardProps {
  name: string;
  image?: string;
  profession?: string;
  company?: string;
  city?: string;
  country?: string;
  batch?: string;
  userId: string;
}

export function MemberCard({
  name,
  image,
  profession,
  company,
  city,
  country,
  batch,
  userId,
}: MemberCardProps) {
  const imgUrl = image ? buildCloudinaryUrl(image, { width: 120, height: 120, crop: "fill", gravity: "face" }) : null;

  return (
    <Link href={`/members/${userId}`} className="block h-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-2xl">
      <article className="group flex h-full cursor-pointer flex-col items-center rounded-2xl border border-border/50 bg-card/95 backdrop-blur-sm p-5 text-center shadow-sm ring-1 ring-border/10 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl hover:ring-primary/20 hover:bg-card dark:bg-card/90 dark:border-border/30 dark:ring-border/5 sm:p-6">
        <div className="relative mb-4">
          <Avatar className="size-16 ring-2 ring-border/50 transition-all group-hover:ring-primary/50 sm:size-18">
            <AvatarImage src={imgUrl ?? image ?? ""} alt="" />
            <AvatarFallback className="text-lg font-bold sm:text-xl">{name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
        <h3 className="mb-2 line-clamp-2 text-base font-bold leading-tight text-foreground transition-colors group-hover:text-primary">
          {name}
        </h3>
        {profession ? <p className="mb-3 line-clamp-2 text-sm leading-snug text-muted-foreground font-medium">{profession}</p> : null}
        <div className="mt-auto w-full space-y-2 text-xs text-muted-foreground sm:text-sm">
          {company ? (
            <div className="flex items-center justify-center gap-1.5">
              <Building2 className="size-4 shrink-0 opacity-80" aria-hidden />
              <span className="line-clamp-1 font-medium">{company}</span>
            </div>
          ) : null}
          {city || country ? (
            <div className="flex items-center justify-center gap-1.5">
              <MapPin className="size-4 shrink-0 opacity-80" aria-hidden />
              <span className="line-clamp-2">{[city, country].filter(Boolean).join(", ")}</span>
            </div>
          ) : null}
          {batch ? (
            <div className="flex items-center justify-center gap-1.5">
              <GraduationCap className="size-4 shrink-0 opacity-80" aria-hidden />
              <span className="font-medium">Batch {batch}</span>
            </div>
          ) : null}
        </div>
      </article>
    </Link>
  );
}

