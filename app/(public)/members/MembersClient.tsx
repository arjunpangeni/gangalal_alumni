"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { MemberCard } from "@/components/cards/MemberCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Loader2,
  GraduationCap,
  Globe,
  MapPin,
  X,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { memberMatchesTokens, searchTokens } from "@/lib/member-match";
import { cn } from "@/lib/utils";

export interface MemberProfile {
  profession?: string;
  company?: string;
  city?: string;
  country?: string;
  permanentAddress?: string;
  schoolPeriod?: string;
  bio?: string;
  slcSeeBatch?: number;
  batch?: string;
}

export interface Member {
  _id: string;
  name: string;
  image?: string;
  profile?: MemberProfile;
}

export function MembersClient({ initialMembers }: { initialMembers: Member[] }) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [refineOpen, setRefineOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const hasHydratedRef = useRef(false);

  const clientTokens = useMemo(() => {
    const combined = [batchFilter, countryFilter, locationFilter].filter(Boolean).join(" ");
    return searchTokens(combined);
  }, [batchFilter, countryFilter, locationFilter]);

  const displayMembers = useMemo(() => {
    if (clientTokens.length === 0) return members;
    return members.filter((m) => memberMatchesTokens(m, clientTokens));
  }, [members, clientTokens]);

  const refineActiveCount = [batchFilter, countryFilter, locationFilter].filter((s) => s.trim()).length;

  const fetchMembers = useCallback(async (q: string, after?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "20" });
      if (q) params.set("q", q);
      if (after) params.set("after", after);
      const res = await fetch(`/api/members?${params}`);
      const json = await res.json();
      if (json.success) {
        const data = json.data as Member[];
        if (after) {
          setMembers((prev) => [...prev, ...data]);
        } else {
          setMembers(data);
        }
        setCursor(json.meta?.nextCursor ?? null);
        setHasMore(!!json.meta?.nextCursor);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      if (!debouncedSearch.trim() && initialMembers.length > 0) return;
    }
    fetchMembers(debouncedSearch);
  }, [debouncedSearch, fetchMembers, initialMembers.length]);

  const observerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && cursor) {
          fetchMembers(debouncedSearch, cursor);
        }
      },
      { threshold: 0.5 }
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [cursor, hasMore, loading, debouncedSearch, fetchMembers]);

  const showRefineHint = clientTokens.length > 0 && displayMembers.length === 0 && members.length > 0;

  function clearRefine() {
    setBatchFilter("");
    setCountryFilter("");
    setLocationFilter("");
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-b from-card to-card/80 shadow-md ring-1 ring-border/30 dark:from-card/90 dark:to-card/60 dark:ring-border/40">
        <div className="border-b border-border/50 bg-muted/30 px-4 py-3 dark:bg-muted/20 sm:px-5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" aria-hidden />
            Find members
          </div>
        </div>

        <div className="space-y-5 p-6 sm:p-7">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground/80"
              aria-hidden
            />
            <Input
              placeholder="Name, profession, company, or city…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-12 rounded-2xl border-border/70 bg-background/90 pl-12 pr-24 text-base shadow-inner dark:bg-background/50"
              aria-label="Search members"
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

          <p className="text-[14px] leading-relaxed text-muted-foreground sm:text-left">
            Server search uses name, profession, company, and city. Refine filters apply to members already loaded—scroll to
            load more, then narrow by batch, country, or address.
          </p>

          <button
            type="button"
            onClick={() => setRefineOpen((v) => !v)}
            aria-expanded={refineOpen}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-dashed border-border/80 bg-muted/20 py-4 text-sm font-medium text-foreground transition hover:bg-muted/40 dark:border-border/60 dark:bg-muted/10 dark:hover:bg-muted/25"
          >
            <ChevronDown className={cn("size-4 transition-transform", refineOpen && "rotate-180")} aria-hidden />
            {refineOpen ? "Hide refine filters" : "Refine loaded members"}
            {refineActiveCount > 0 ? (
              <span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-primary">{refineActiveCount}</span>
            ) : null}
          </button>

          {refineOpen ? (
            <div className="space-y-5 border-t border-border/50 pt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-semibold text-foreground">Batch, country & location</span>
                {refineActiveCount > 0 ? (
                  <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={clearRefine}>
                    Clear all
                  </Button>
                ) : null}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="relative">
                  <GraduationCap
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    placeholder="Batch year"
                    value={batchFilter}
                    onChange={(e) => setBatchFilter(e.target.value)}
                    className="h-11 rounded-xl border-border/70 bg-background/80 pl-10 dark:bg-background/50"
                    aria-label="Filter by batch year"
                  />
                </div>
                <div className="relative">
                    <Globe
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    placeholder="Country"
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                    className="h-11 rounded-xl border-border/70 bg-background/80 pl-10 dark:bg-background/50"
                    aria-label="Filter by country"
                  />
                </div>
                <div className="relative">
                  <MapPin
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    placeholder="City or address keyword"
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="h-11 rounded-xl border-border/70 bg-background/80 pl-10 dark:bg-background/50"
                    aria-label="Filter by city or address"
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          Showing{" "}
          <span className="font-semibold tabular-nums text-foreground">{displayMembers.length}</span>
          {clientTokens.length > 0 ? (
            <>
              {" "}
              filtered · <span className="tabular-nums text-foreground">{members.length}</span> loaded
            </>
          ) : (
            <> members</>
          )}
        </span>
        {hasMore ? <span className="text-xs">Scroll down for more</span> : null}
      </div>

      {showRefineHint ? (
        <p className="rounded-2xl border border-amber-500/35 bg-amber-500/[0.09] px-4 py-3 text-sm text-amber-950 dark:border-amber-500/25 dark:bg-amber-950/30 dark:text-amber-50">
          No loaded members match these filters. Scroll to load more profiles, or clear a refine field.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {displayMembers.map((m) => (
          <MemberCard
            key={m._id}
            userId={m._id}
            name={m.name}
            image={m.image}
            profession={m.profile?.profession}
            company={m.profile?.company}
            city={m.profile?.city}
            country={m.profile?.country}
            batch={m.profile?.batch ?? (m.profile?.slcSeeBatch != null ? String(m.profile.slcSeeBatch) : undefined)}
          />
        ))}
      </div>
      {displayMembers.length === 0 && !loading && (
        <div className="rounded-3xl border border-dashed border-border/80 bg-muted/20 py-16 text-center text-sm text-muted-foreground">
          No members match your search or filters.
        </div>
      )}
      <div ref={observerRef} className="mt-4 flex h-8 items-center justify-center">
        {loading && <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden />}
      </div>
    </div>
  );
}
