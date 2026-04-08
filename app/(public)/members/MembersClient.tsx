"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { MemberCard } from "@/components/cards/MemberCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, X, UserRoundCheck } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useI18n } from "@/components/i18n/I18nProvider";

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

type MemberFilters = {
  search: string;
  batch: string;
  country: string;
  city: string;
  profession: string;
};

function filtersEmpty(f: MemberFilters) {
  return (
    !f.search.trim() &&
    !f.batch.trim() &&
    !f.country.trim() &&
    !f.city.trim() &&
    !f.profession.trim()
  );
}

export function MembersClient({
  initialMembers,
  totalCount,
}: {
  initialMembers: Member[];
  totalCount: number;
}) {
  const { messages } = useI18n();
  const [search, setSearch] = useState("");
  const [batch, setBatch] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [profession, setProfession] = useState("");

  const filterForm = useMemo(
    () => ({ search, batch, country, city, profession }),
    [search, batch, country, city, profession]
  );
  const debouncedFilters = useDebounce(filterForm, 400);

  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [loading, setLoading] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const hasHydratedRef = useRef(false);
  const debouncedFiltersRef = useRef(debouncedFilters);
  debouncedFiltersRef.current = debouncedFilters;
  const membersFetchAbortRef = useRef<AbortController | null>(null);

  const fetchMembers = useCallback(async (after?: string) => {
    membersFetchAbortRef.current?.abort();
    const ac = new AbortController();
    membersFetchAbortRef.current = ac;
    const { signal } = ac;

    const f = debouncedFiltersRef.current;
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "20" });
      if (f.search.trim()) params.set("q", f.search.trim());
      if (f.batch.trim()) params.set("batch", f.batch.trim());
      if (f.country.trim()) params.set("country", f.country.trim());
      if (f.city.trim()) params.set("city", f.city.trim());
      if (f.profession.trim()) params.set("profession", f.profession.trim());
      if (after) params.set("after", after);

      const res = await fetch(`/api/members?${params}`, { signal });
      const json = await res.json();
      if (signal.aborted) return;
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
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("[MembersClient] fetchMembers:", err);
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true;
      if (filtersEmpty(debouncedFilters) && initialMembers.length > 0) return;
    }
    setMembers([]);
    setCursor(null);
    setHasMore(true);
    void fetchMembers();
    return () => membersFetchAbortRef.current?.abort();
  }, [debouncedFilters, fetchMembers, initialMembers.length]);

  const observerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && cursor) {
          void fetchMembers(cursor);
        }
      },
      { threshold: 0.5 }
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [cursor, hasMore, loading, fetchMembers]);

  const refineActive =
    !!batch.trim() || !!country.trim() || !!city.trim() || !!profession.trim();

  function clearFilters() {
    setBatch("");
    setCountry("");
    setCity("");
    setProfession("");
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-4 border-b border-border/50 pb-4 sm:pb-5 lg:pb-4">
        <div className="min-w-0">
          <h1 className="font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl">{messages.nav.members}</h1>
          <p
            className="mt-3 flex gap-2.5 rounded-xl border border-primary/20 bg-primary/[0.06] px-3.5 py-3 text-sm leading-relaxed text-foreground/90 shadow-sm dark:border-primary/25 dark:bg-primary/[0.09] sm:mt-4 sm:px-4 sm:py-3.5"
            role="note"
          >
            <UserRoundCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            <span>{messages.publicClients.membersDirectoryNotice}</span>
          </p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground sm:mt-3.5 sm:text-sm">
            <span className="text-muted-foreground/80">
              <span className="tabular-nums text-foreground/90">{totalCount.toLocaleString()}</span> {messages.publicClients.verified}
              {members.length > 0 ? (
                <>
                  {" "}
                  · <span className="tabular-nums text-foreground/90">{members.length}</span> {messages.publicClients.shown}
                </>
              ) : null}
              {hasMore && members.length > 0 ? <span className="text-muted-foreground/70"> · {messages.publicClients.scrollForMore}</span> : null}
            </span>
          </p>
        </div>

        <div className="relative w-full">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/75 sm:left-2.5 sm:size-3.5"
            aria-hidden
          />
          <Input
            placeholder={messages.publicClients.searchMembersPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border-border/60 bg-background/90 py-2 pl-10 pr-11 text-base shadow-sm transition-surface sm:h-9 sm:rounded-lg sm:pl-8 sm:pr-10 sm:text-sm dark:bg-background/50"
            aria-label={messages.publicClients.searchMembers}
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-surface hover:bg-muted hover:text-foreground sm:right-2.5 sm:size-7 sm:rounded-md"
              aria-label={messages.publicClients.clearSearch}
            >
              <X className="size-4 sm:size-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-col gap-2.5 sm:gap-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{messages.publicClients.filters}</p>
            {refineActive ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="hidden h-8 shrink-0 text-xs sm:inline-flex"
                onClick={clearFilters}
              >
                {messages.publicClients.clearFilters}
              </Button>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
            <Input
              placeholder={messages.publicClients.batch}
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              className="h-11 w-full rounded-xl border-border/60 bg-background/90 text-base transition-surface sm:h-9 sm:rounded-lg sm:text-sm dark:bg-background/50"
              aria-label={messages.publicClients.filterByBatch}
            />
            <Input
              placeholder={messages.profile.country}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="h-11 w-full rounded-xl border-border/60 bg-background/90 text-base transition-surface sm:h-9 sm:rounded-lg sm:text-sm dark:bg-background/50"
              aria-label={messages.publicClients.filterByCountry}
            />
            <Input
              placeholder={messages.profile.city}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="h-11 w-full rounded-xl border-border/60 bg-background/90 text-base transition-surface sm:h-9 sm:rounded-lg sm:text-sm dark:bg-background/50"
              aria-label={messages.publicClients.filterByCity}
            />
            <Input
              placeholder={messages.profile.profession}
              value={profession}
              onChange={(e) => setProfession(e.target.value)}
              className="h-11 w-full rounded-xl border-border/60 bg-background/90 text-base transition-surface sm:h-9 sm:rounded-lg sm:text-sm dark:bg-background/50"
              aria-label={messages.publicClients.filterByProfession}
            />
          </div>
          {refineActive ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 w-full text-sm sm:hidden"
              onClick={clearFilters}
            >
              {messages.publicClients.clearFilters}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 min-[400px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {members.map((m) => (
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

      {members.length === 0 && !loading && (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/25 py-14 text-center text-sm text-muted-foreground sm:rounded-3xl">
          {messages.publicClients.noMembersMatch}
        </div>
      )}

      <div ref={observerRef} className="flex h-8 items-center justify-center">
        {loading ? <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden /> : null}
      </div>
    </div>
  );
}
