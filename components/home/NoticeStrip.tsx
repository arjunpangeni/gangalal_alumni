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

export function NoticeStrip({ notices, embedded }: { notices: HomeNotice[]; embedded?: boolean }) {
  if (!notices.length) return null;

  const header = (
    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground sm:mb-4">
      <Megaphone className="size-4 shrink-0 text-primary" aria-hidden />
      <span className="font-heading">Notices</span>
    </div>
  );

  const listClass = embedded
    ? "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
    : "flex flex-col gap-3 sm:gap-4";

  const itemClass = embedded
    ? "rounded-2xl border border-border/60 bg-muted/20 px-3 py-3 shadow-sm ring-1 ring-primary/[0.04] dark:border-border/50 dark:bg-muted/15 sm:px-4 sm:py-4"
    : "rounded-2xl border border-border/60 bg-card/95 px-4 py-4 shadow-card ring-1 ring-primary/[0.05] transition-surface dark:border-border/50 dark:bg-card/90 sm:rounded-3xl sm:px-5 sm:py-5";

  const list = (
    <ul className={listClass}>
      {notices.map((n) => (
        <li key={n._id} className={itemClass}>
          <h3
            className={
              embedded
                ? "font-heading text-sm font-semibold leading-snug text-foreground sm:text-base"
                : "font-heading text-base font-semibold text-foreground sm:text-lg"
            }
          >
            {n.title}
          </h3>
          <p
            className={
              embedded
                ? "mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground sm:text-sm"
                : "mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground"
            }
          >
            {n.body}
          </p>
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
  );

  if (embedded) {
    return (
      <div aria-live="polite">
        {header}
        {list}
      </div>
    );
  }

  return (
    <section className="border-b border-primary/15 bg-gradient-to-b from-primary/[0.07] via-indigo-500/[0.04] to-transparent dark:border-primary/20 dark:from-primary/[0.1] dark:via-indigo-500/[0.06]">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {header}
        {list}
      </div>
    </section>
  );
}
