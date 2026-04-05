import connectDB from "@/lib/db";
import Album from "@/lib/models/Album";
import { PageShell, PageHeader } from "@/components/layout/Page";
import { AdminGalleryClient, type AdminAlbumRow } from "./AdminGalleryClient";

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
        title="Gallery"
        description={
          <>
            Create albums and upload photos (stored in Cloudinary). Published albums appear on the public{" "}
            <span className="text-foreground font-medium">/gallery</span> page.
          </>
        }
      />
      <AdminGalleryClient initialAlbums={initialAlbums} />
    </PageShell>
  );
}
