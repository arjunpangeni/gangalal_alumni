"use client";

import { useMemo, useState } from "react";
import { Images, Search, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { PageEmptyState } from "@/components/layout/Page";

export interface GalleryAlbum {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  photos: { url: string }[];
}

function albumMatchesQuery(album: GalleryAlbum, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const title = album.title.toLowerCase();
  const desc = (album.description ?? "").toLowerCase();
  return title.includes(s) || desc.includes(s);
}

export function GalleryClient({ albums }: { albums: GalleryAlbum[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => albums.filter((a) => albumMatchesQuery(a, search)), [albums, search]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 border-b border-border/50 pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pb-5 lg:pb-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-heading text-lg font-semibold tracking-tight text-foreground sm:text-xl">Gallery</h1>
          <p className="mt-0.5 truncate text-xs leading-snug text-muted-foreground sm:text-sm">
            Browse albums—open one for a full-screen viewer with zoom.
            {albums.length > 0 && (
              <span className="text-muted-foreground/80">
                {" "}
                · <span className="tabular-nums text-foreground/90">{filtered.length}</span>
                {search.trim() && filtered.length !== albums.length ? (
                  <>
                    {" "}
                    of <span className="tabular-nums">{albums.length}</span>
                  </>
                ) : null}{" "}
                album{filtered.length === 1 ? "" : "s"}
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
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 rounded-lg border-border/60 bg-background/90 py-2 pl-8 pr-10 text-sm shadow-sm transition-surface dark:bg-background/50"
            aria-label="Search albums"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-surface hover:bg-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {filtered.map((album) => {
          const cover = album.coverImage ?? album.photos?.[0]?.url;
          const count = album.photos?.length ?? 0;
          return (
            <Link key={album._id} href={`/gallery/${album.slug}`} className="group block h-full">
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm ring-1 ring-border/40 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md dark:border-border/60 dark:bg-card/80 dark:ring-border/30">
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  {cover ? (
                    <Image
                      src={cover}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Images className="size-14 text-muted-foreground/25" aria-hidden />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-90" />
                  <span className="absolute bottom-3 right-3 rounded-full bg-black/45 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm tabular-nums">
                    {count} photo{count === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <h3 className="font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                    {album.title}
                  </h3>
                  {album.description ? (
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{album.description}</p>
                  ) : null}
                </div>
              </article>
            </Link>
          );
        })}
        {albums.length === 0 && (
          <div className="col-span-full">
            <PageEmptyState
              icon={<Images className="size-10" />}
              title="No albums yet"
              description="Photo albums will appear here."
            />
          </div>
        )}
        {albums.length > 0 && filtered.length === 0 && (
          <div className="col-span-full">
            <PageEmptyState
              icon={<Images className="size-10" />}
              title="No albums match your search"
              description="Try another title or keyword from the description."
            />
          </div>
        )}
      </div>
    </div>
  );
}
