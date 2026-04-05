import connectDB from "@/lib/db";
import Album from "@/lib/models/Album";
import { Images } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import { PageShell, PageHeader, PageEmptyState } from "@/components/layout/Page";

export const metadata: Metadata = { title: "Gallery" };
export const dynamic = "force-dynamic";

interface AlbumDoc {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  photos: { url: string }[];
}

export default async function GalleryPage() {
  let albums: AlbumDoc[] = [];
  try {
    await connectDB();
    albums = (await Album.find({ status: "published", deletedAt: null })
      .sort({ createdAt: -1 })
      .select("title slug description coverImage photos")
      .lean()) as unknown as AlbumDoc[];
  } catch {
    /* DB unavailable */
  }

  return (
    <PageShell className="max-w-6xl">
      <PageHeader title="Gallery" description="Browse albums—open one for a full-screen viewer with zoom." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
        {albums.map((album) => {
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
      </div>
    </PageShell>
  );
}
