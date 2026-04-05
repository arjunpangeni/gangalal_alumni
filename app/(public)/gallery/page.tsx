import connectDB from "@/lib/db";
import Album from "@/lib/models/Album";
import type { Metadata } from "next";
import { PageShell } from "@/components/layout/Page";
import { PageListingShell } from "@/components/layout/PageListingShell";
import { GalleryClient, type GalleryAlbum } from "./GalleryClient";
export const metadata: Metadata = { title: "Gallery" };
export const revalidate = 60;

export default async function GalleryPage() {
  let albums: GalleryAlbum[] = [];
  try {
    await connectDB();
    const raw = await Album.find({ status: "published", deletedAt: null })
      .sort({ createdAt: -1 })
      .select("title slug description coverImage photos")
      .lean();
    albums = JSON.parse(JSON.stringify(raw)) as GalleryAlbum[];
  } catch {
    /* DB unavailable */
  }

  return (
    <PageListingShell>
      <PageShell className="max-w-6xl">
        <GalleryClient albums={albums} />
      </PageShell>
    </PageListingShell>
  );
}
