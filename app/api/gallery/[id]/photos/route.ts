import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAdmin } from "@/lib/auth-guard";
import { badRequest, forbidden, notFound, serverError } from "@/lib/errors";
import { addPhotosSchema, deleteGalleryPhotoSchema } from "@/lib/validations/gallery";
import connectDB from "@/lib/db";
import Album from "@/lib/models/Album";
import cloudinary, { assertCloudinaryConfigured } from "@/lib/cloudinary";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await requireAuth();
    if (!isAdmin(session)) return forbidden();

    const body = await req.json();
    const parsed = addPhotosSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");

    await connectDB();
    const album = await Album.findById(id);
    if (!album) return notFound();

    await Album.updateOne({ _id: id }, { $push: { photos: { $each: parsed.data.photos } } });

    return NextResponse.json({ success: true });
  } catch {
    return serverError();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await requireAuth();
    if (!isAdmin(session)) return forbidden();

    const body = await req.json().catch(() => ({}));
    const parsed = deleteGalleryPhotoSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");

    const { publicId } = parsed.data;

    await connectDB();
    const album = await Album.findById(id).lean();
    if (!album) return notFound();

    const exists = Array.isArray(album.photos) && album.photos.some((p: { publicId?: string }) => p.publicId === publicId);
    if (!exists) return notFound();

    await Album.updateOne({ _id: id }, { $pull: { photos: { publicId } } });

    try {
      assertCloudinaryConfigured();
      await cloudinary.uploader.destroy(publicId).catch(() => undefined);
    } catch {
      /* photo already removed from album */
    }

    return NextResponse.json({ success: true });
  } catch {
    return serverError();
  }
}
