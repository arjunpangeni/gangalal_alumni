import { notFound } from "next/navigation";
import connectDB from "@/lib/db";
import Album from "@/lib/models/Album";
import { GalleryAlbumExperience, type GalleryPhoto } from "@/components/gallery/GalleryAlbumExperience";
import type { Metadata } from "next";
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    await connectDB();
    const album = await Album.findOne({ slug, status: "published", deletedAt: null })
      .select("title description")
      .lean();
    if (!album) return { title: "Album" };
    const title = typeof album.title === "string" ? album.title : "Album";
    const desc = typeof album.description === "string" ? album.description : undefined;
    return {
      title: `${title} · Gallery`,
      description: desc,
      openGraph: { title, description: desc },
    };
  } catch {
    return { title: "Gallery" };
  }
}

export default async function GalleryAlbumPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectDB();
  const album = await Album.findOne({ slug, status: "published", deletedAt: null })
    .select("title description photos")
    .lean();

  if (!album) notFound();

  const title = String(album.title ?? "Album");
  const description = album.description ? String(album.description) : undefined;
  const rawPhotos = Array.isArray(album.photos) ? album.photos : [];
  const photos: GalleryPhoto[] = rawPhotos.map((p: { url?: string; caption?: string }) => ({
    url: String(p.url ?? ""),
    caption: p.caption ? String(p.caption) : undefined,
  })).filter((p) => p.url.length > 0);

  return <GalleryAlbumExperience title={title} description={description} photos={photos} />;
}
