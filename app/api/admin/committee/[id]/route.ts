import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { requireAuth, isSuperAdmin } from "@/lib/auth-guard";
import { badRequest, forbidden, notFound, serverError, success, tooManyRequests } from "@/lib/errors";
import { committeeMemberPatchSchema } from "@/lib/validations/committee";
import connectDB from "@/lib/db";
import CommitteeMember from "@/lib/models/CommitteeMember";
import { sanitizeInput } from "@/lib/utils";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";
import { deleteManagedCloudinaryImageByUrl } from "@/lib/cloudinary-delete";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    if (!isSuperAdmin(session)) return forbidden();

    const limited = await applyRateLimit(adminLimiter, session.user!.id!);
    if (limited) return tooManyRequests();

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return badRequest("Invalid id");

    const body = await req.json();
    const parsed = committeeMemberPatchSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
    if (Object.keys(parsed.data).length === 0) return badRequest("No fields to update");

    await connectDB();
    const doc = await CommitteeMember.findById(id);
    if (!doc) return notFound();

    const d = parsed.data;
    const prevPhoto = (doc.photo ?? "").trim() || undefined;
    if (d.name !== undefined) doc.name = sanitizeInput(d.name, 120);
    if (d.post !== undefined) doc.post = sanitizeInput(d.post, 120);
    if (d.photo !== undefined) {
      const photoTrim = (d.photo ?? "").trim();
      const nextPhoto = photoTrim.length > 0 ? photoTrim : undefined;
      if (prevPhoto && prevPhoto !== nextPhoto) {
        await deleteManagedCloudinaryImageByUrl(prevPhoto);
      }
      doc.photo = nextPhoto;
    }
    if (d.sortOrder !== undefined) doc.sortOrder = d.sortOrder;
    await doc.save();

    revalidatePath("/about", "page");

    const o = doc.toObject();
    const photo = ((o.photo as string | undefined) ?? "").trim();
    return success({
      _id: String(doc._id),
      name: o.name as string,
      post: o.post as string,
      photo: photo.length > 0 ? photo : undefined,
      sortOrder: (o.sortOrder as number) ?? 0,
    });
  } catch {
    return serverError();
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    if (!isSuperAdmin(session)) return forbidden();

    const limited = await applyRateLimit(adminLimiter, session.user!.id!);
    if (limited) return tooManyRequests();

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return badRequest("Invalid id");

    await connectDB();
    const doc = await CommitteeMember.findById(id).select("photo").lean();
    if (!doc) return notFound();
    const photoUrl = (doc.photo as string | undefined)?.trim();
    if (photoUrl) await deleteManagedCloudinaryImageByUrl(photoUrl);
    await CommitteeMember.findByIdAndDelete(id);

    revalidatePath("/about", "page");

    return success({ deleted: true });
  } catch {
    return serverError();
  }
}
