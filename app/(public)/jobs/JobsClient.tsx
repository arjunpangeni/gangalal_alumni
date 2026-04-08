"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button-variants";
import { Building2, MapPin, ExternalLink, Briefcase, GraduationCap, Clock, Mail, Phone, Search, Loader2, X } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { PageEmptyState } from "@/components/layout/Page";
import { useI18n } from "@/components/i18n/I18nProvider";

interface Job {
  _id: string;
  title: string;
  slug: string;
  company: string;
  location: string;
  type: string;
  salary?: string;
  applyUrl?: string;
  applyEmail?: string;
  applyPhone?: string;
  tags?: string[];
  description?: string;
  educationOrSkills?: string;
  expiresAt?: string;
}

export function JobsClient({ initialJobs }: { initialJobs: unknown[] }) {
  const { messages } = useI18n();
  const [jobs, setJobs] = useState<Job[]>(initialJobs as Job[]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const hasHydratedRef = useRef(false);

  const fetchJobs = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (q) params.set("q", q);
      const res = await fetch(`/api/jobs?${params}`);
      const json = await res.json();
      if (json.success) {
        setJobs(json.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      if (!debouncedSearch.trim() && initialJobs.length > 0) return;
    }
    void fetchJobs(debouncedSearch);
  }, [debouncedSearch, fetchJobs, initialJobs.length]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 border-b border-border/50 pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pb-5 lg:pb-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl">{messages.nav.jobs}</h1>
          <p className="mt-0.5 truncate text-xs leading-snug text-muted-foreground sm:text-sm">
            {messages.publicClients.jobsSubtitle}
            {(!loading || jobs.length > 0) && (
              <span className="text-muted-foreground/80">
                {" "}
                · <span className="tabular-nums text-foreground/90">{jobs.length}</span>{" "}
                {jobs.length === 1 ? messages.publicClients.listing : messages.publicClients.listings}
              </span>
            )}
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
            className="h-9 rounded-lg border-border/60 bg-background/90 py-2 pl-8 pr-16 text-sm shadow-sm transition-surface dark:bg-background/50"
            aria-label={messages.publicClients.searchJobs}
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-8 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-surface hover:bg-muted hover:text-foreground"
              aria-label={messages.publicClients.clearSearch}
            >
              <X className="size-3.5" />
            </button>
          ) : null}
          {loading && debouncedSearch.trim() ? (
            <Loader2
              className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-primary"
              aria-hidden
            />
          ) : null}
        </div>
      </div>

      <p
        className="flex gap-2.5 rounded-xl border border-primary/20 bg-primary/[0.06] px-3.5 py-3 text-sm leading-relaxed text-foreground/90 shadow-sm dark:border-primary/25 dark:bg-primary/[0.09] sm:px-4 sm:py-3.5"
        role="note"
      >
        <Briefcase className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <span>{messages.publicClients.postJobHint}</span>
      </p>

      <div className="space-y-4 sm:space-y-5">
        {jobs.map((job) => (
          <article
            key={job._id}
            id={job.slug}
            className="flex flex-col gap-5 rounded-2xl border border-border/60 bg-card/95 p-6 shadow-card ring-1 ring-primary/[0.04] transition-surface hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_12px_40px_oklch(0.35_0.1_264/0.12)] dark:border-border/45 dark:bg-card/90 sm:flex-row sm:items-start sm:rounded-3xl"
          >
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-muted/80 dark:bg-muted/60">
              <Briefcase className="size-6 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h3 className="font-bold text-lg leading-tight">{job.title}</h3>
                <Badge variant="secondary" className="font-medium bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary-foreground dark:border-primary/30">{job.type}</Badge>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground mb-3">
                <span className="flex items-center gap-2"><Building2 className="size-4" />{job.company}</span>
                <span className="flex items-center gap-2"><MapPin className="size-4" />{job.location}</span>
                {job.salary && <span className="font-medium text-foreground">{job.salary}</span>}
              </div>
              {job.tags && job.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {job.tags.slice(0, 5).map((t) => (
                    <Badge key={t} variant="outline" className="text-xs font-medium border-border/60 dark:border-border/40">{t}</Badge>
                  ))}
                </div>
              )}
              {job.expiresAt ? (
                <p className="mb-3 text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="size-4" />
                  {messages.publicClients.applyBy} {formatDate(job.expiresAt)}
                </p>
              ) : null}
              {job.educationOrSkills ? (
                <p className="mb-4 text-sm text-muted-foreground leading-relaxed flex gap-2">
                  <GraduationCap className="size-5 shrink-0 mt-0.5" />
                  <span>{job.educationOrSkills}</span>
                </p>
              ) : null}
              <p className="text-sm text-foreground/90 leading-relaxed line-clamp-4 whitespace-pre-wrap">{job.description ?? ""}</p>
            </div>
            <div className="flex flex-col gap-3 shrink-0 w-full sm:w-auto sm:min-w-[12rem]">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center sm:text-left">{messages.publicClients.apply}</p>
              <div className="flex flex-wrap gap-3 justify-center sm:flex-col sm:items-stretch">
                {job.applyEmail?.trim() ? (
                  <>
                    <a
                      href={`mailto:${job.applyEmail.trim()}`}
                      className="order-1 w-full rounded-xl border border-border/60 bg-primary/[0.06] px-3 py-2.5 text-center text-sm font-medium text-primary break-all transition-surface hover:bg-primary/10 dark:border-primary/20 dark:bg-primary/[0.08] sm:text-left"
                    >
                      <span className="mb-1 flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:justify-start">
                        <Mail className="size-3.5 shrink-0 text-primary" aria-hidden />
                        {messages.publicClients.emailAddress}
                      </span>
                      {job.applyEmail.trim()}
                    </a>
                    <a
                      href={`mailto:${job.applyEmail.trim()}`}
                      className={`${buttonVariants({ size: "default", variant: "default" })} order-2 gradient-primary w-full border-0 text-white inline-flex gap-2 shadow-sm`}
                    >
                      <Mail className="size-4" />
                      {messages.public.email}
                    </a>
                  </>
                ) : null}
                {job.applyPhone?.trim() ? (
                  <a
                    href={`tel:${job.applyPhone.trim().replace(/\s/g, "")}`}
                    className={`${buttonVariants({ size: "default", variant: "outline" })} inline-flex gap-2`}
                  >
                    <Phone className="size-4" />
                    {messages.publicClients.callWhatsapp}
                  </a>
                ) : null}
                {job.applyUrl?.trim() ? (
                  <a href={job.applyUrl.trim()} target="_blank" rel="noopener noreferrer" className={`${buttonVariants({ size: "default", variant: "outline" })} inline-flex gap-2`}>
                    <ExternalLink className="size-4" />
                    Link
                  </a>
                ) : null}
                {!job.applyEmail?.trim() && !job.applyPhone?.trim() && !job.applyUrl?.trim() ? (
                  <span className={`${buttonVariants({ size: "default", variant: "secondary" })} cursor-default justify-center gap-2`}>
                    {messages.publicClients.contactInDescription}
                  </span>
                ) : null}
              </div>
            </div>
          </article>
        ))}
        {jobs.length === 0 && !loading && (
          <PageEmptyState
            icon={<Briefcase className="size-10" />}
            title={messages.publicClients.noJobListings}
            description={messages.publicClients.newOpportunities}
          />
        )}
      </div>
    </div>
  );
}