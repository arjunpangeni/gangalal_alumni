import connectDB from "@/lib/db";
import Album from "@/lib/models/Album";
import { PageShell, PageHeader } from "@/components/layout/Page";
import { AdminGalleryClient, type AdminAlbumRow } from "./AdminGalleryClient";
import { I18nText } from "@/components/i18n/I18nText";

export const unstable_dynamicStaleTime = 30;

export default async function AdminGalleryPage() {
  await connectDB();

  const albums = await Album.find({ deletedAt: null })
    .sort({ createdAt: -1 })
    .limit(50)
    .select("title slug status photos")
    .lean();

  const initialAlbums: AdminAlbumRow[] = albums.map((album) => {
    const raw = Array.isArray(album.photos) ? album.photos : [];
    const photos = raw.map((p: { url?: string; publicId?: string }) => ({
      url: String(p.url ?? ""),
      publicId: String(p.publicId ?? ""),
    })).filter((p) => p.url && p.publicId);
    return {
      _id: String(album._id),
      title: album.title as string,
      slug: album.slug as string,
      status: album.status as string,
      photoCount: raw.length,
      photos,
    };
  });

  return (
    <PageShell className="max-w-4xl px-0 space-y-6">
      <PageHeader
        title={<I18nText id="adminPages.galleryTitle" fallback="Gallery" />}
        description={<I18nText id="adminPages.galleryDesc" fallback="Create albums and upload photos. Published albums appear on the public /gallery page." />}
      />
      <AdminGalleryClient initialAlbums={initialAlbums} />
    </PageShell>
  );
}
