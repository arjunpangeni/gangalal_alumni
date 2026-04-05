import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAdmin } from "@/lib/auth-guard";
import { forbidden, notFound, serverError } from "@/lib/errors";
import connectDB from "@/lib/db";
import Album from "@/lib/models/Album";
import cloudinary, { assertCloudinaryConfigured } from "@/lib/cloudinary";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await requireAuth();
    if (!isAdmin(session)) return forbidden();

    await connectDB();
    const album = await Album.findById(id).lean();
    if (!album) return notFound();

    const photos = Array.isArray(album.photos) ? album.photos : [];
    try {
      assertCloudinaryConfigured();
      await Promise.all(
        photos.map((p: { publicId?: string }) =>
          p.publicId ? cloudinary.uploader.destroy(p.publicId).catch(() => undefined) : Promise.resolve()
        )
      );
    } catch {
      /* still remove from DB if Cloudinary is misconfigured */
    }

    await Album.updateOne(
      { _id: id },
      { $set: { deletedAt: new Date(), photos: [] } }
    );

    return NextResponse.json({ success: true });
  } catch {
    return serverError();
  }
}
