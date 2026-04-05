"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button-variants";
import { Building2, MapPin, ExternalLink, Briefcase, GraduationCap, Clock, Mail, Phone, Search, Loader2, X } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { PageEmptyState } from "@/components/layout/Page";

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
  description: string;
  educationOrSkills?: string;
  expiresAt?: string;
}

export function JobsClient() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const debouncedSearch = useDebounce(search, 300);

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
    fetchJobs(debouncedSearch);
  }, [debouncedSearch, fetchJobs]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-b from-card to-card/80 shadow-md ring-1 ring-border/30 dark:from-card/90 dark:to-card/60 dark:ring-border/40">
        <div className="border-b border-border/50 bg-muted/30 px-4 py-3 dark:bg-muted/20 sm:px-5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Search className="size-3.5 text-primary" aria-hidden />
            Find jobs
          </div>
        </div>

        <div className="p-6 sm:p-7">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/80"
              aria-hidden
            />
            <Input
              placeholder="Job title, company, or location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 rounded-2xl border-border/70 bg-background/90 pl-12 pr-24 text-base shadow-inner dark:bg-background/50"
              aria-label="Search jobs"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            ) : null}
            {loading && debouncedSearch.trim() ? (
              <Loader2 className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 animate-spin text-primary sm:right-12" aria-hidden />
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing <span className="font-semibold tabular-nums text-foreground">{jobs.length}</span> jobs
        </span>
      </div>

      <div className="space-y-4 sm:space-y-5">
        {jobs.map((job) => (
          <article
            key={job._id}
            id={job.slug}
            className="flex flex-col gap-5 rounded-3xl border border-border/50 bg-card/95 backdrop-blur-sm p-6 transition-all hover:shadow-2xl hover:border-primary/40 hover:ring-1 hover:ring-primary/20 hover:bg-card dark:border-border/30 dark:bg-card/90 sm:flex-row sm:items-start"
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
                  Apply by {formatDate(job.expiresAt)}
                </p>
              ) : null}
              {job.educationOrSkills ? (
                <p className="mb-4 text-sm text-muted-foreground leading-relaxed flex gap-2">
                  <GraduationCap className="size-5 shrink-0 mt-0.5" />
                  <span>{job.educationOrSkills}</span>
                </p>
              ) : null}
              <p className="text-sm text-foreground/90 leading-relaxed line-clamp-4 whitespace-pre-wrap">{job.description}</p>
            </div>
            <div className="flex flex-col gap-3 shrink-0 w-full sm:w-auto sm:min-w-[10rem]">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center sm:text-left">Apply</p>
              <div className="flex flex-wrap gap-3 justify-center sm:flex-col sm:items-stretch">
                {job.applyEmail?.trim() ? (
                  <a
                    href={`mailto:${encodeURIComponent(job.applyEmail.trim())}`}
                    className={`${buttonVariants({ size: "default", variant: "default" })} gradient-primary text-white border-0 inline-flex gap-2 shadow-sm`}
                  >
                    <Mail className="size-4" />
                    Email
                  </a>
                ) : null}
                {job.applyPhone?.trim() ? (
                  <a
                    href={`tel:${job.applyPhone.trim().replace(/\s/g, "")}`}
                    className={`${buttonVariants({ size: "default", variant: "outline" })} inline-flex gap-2`}
                  >
                    <Phone className="size-4" />
                    Call / WhatsApp
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
                    Contact in description
                  </span>
                ) : null}
              </div>
            </div>
          </article>
        ))}
        {jobs.length === 0 && !loading && (
          <PageEmptyState
            icon={<Briefcase className="size-10" />}
            title="No job listings yet"
            description="New opportunities will appear here."
          />
        )}
      </div>
    </div>
  );
}