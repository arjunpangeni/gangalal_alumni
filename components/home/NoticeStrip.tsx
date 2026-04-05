import Link from "next/link";
import { Megaphone } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";

export interface HomeNotice {
  _id: string;
  title: string;
  body: string;
  linkUrl?: string;
  linkLabel?: string;
  expiresAt?: string | Date;
}

export function NoticeStrip({ notices }: { notices: HomeNotice[] }) {
  if (!notices.length) return null;

  return (
    <section className="border-b border-amber-500/20 bg-amber-500/[0.08] dark:border-amber-500/15 dark:bg-amber-950/25">
      <div className="container mx-auto px-4 py-6 sm:py-7">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-amber-950 dark:text-amber-100">
          <Megaphone className="size-4 shrink-0 opacity-90" aria-hidden />
          <span>Notices</span>
        </div>
        <ul className="flex flex-col gap-3 sm:gap-4">
          {notices.map((n) => (
            <li
              key={n._id}
              className="rounded-xl border border-amber-500/30 bg-background/90 px-4 py-3 shadow-sm dark:border-amber-500/20 dark:bg-background/70 sm:px-5 sm:py-4"
            >
              <h3 className="text-base font-semibold text-foreground">{n.title}</h3>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{n.body}</p>
              {n.linkUrl?.trim() ? (
                <div className="mt-2">
                  <Link
                    href={n.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    {n.linkLabel?.trim() || "Learn more"}
                  </Link>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
