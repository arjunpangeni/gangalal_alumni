import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import cloudinary, { assertCloudinaryConfigured, CLOUDINARY_FOLDERS } from "@/lib/cloudinary";
import { deleteManagedCloudinaryImageByUrl, publicIdFromDeliveryUrl } from "@/lib/cloudinary-delete";
import { serverError, badRequest } from "@/lib/errors";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    assertCloudinaryConfigured();
    const session = await requireAuth("approved");

    const formData = await req.formData();
    const file = formData.get("photo") as File | null;
    if (!file) return badRequest("No photo provided");

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) return badRequest("Only JPEG, PNG, WebP or GIF allowed");
    if (file.size > 5 * 1024 * 1024) return badRequest("Photo must be under 5MB");

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    await connectDB();

    const user = await User.findById(session.user!.id).select("image").lean();
    const previousImageUrl = user?.image as string | undefined;

    const result = await cloudinary.uploader.upload(base64, {
      folder: CLOUDINARY_FOLDERS.avatars,
      public_id: `user_${session.user!.id}`,
      overwrite: true,
      transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    });

    const newPublicId = result.public_id as string;
    const prevParsed = previousImageUrl ? publicIdFromDeliveryUrl(previousImageUrl) : null;
    if (prevParsed?.publicId && prevParsed.publicId !== newPublicId) {
      await deleteManagedCloudinaryImageByUrl(previousImageUrl);
    }

    await User.updateOne(
      { _id: session.user!.id },
      { $set: { image: result.secure_url }, $unset: { profileUpdateRequest: 1 } }
    );

    return NextResponse.json({ success: true, url: result.secure_url });
  } catch (err) {
    const maybeResponse = err as { _isResponse?: boolean };
    if (maybeResponse?._isResponse) return err as NextResponse;

    const e = err as { http_code?: number; error?: { message?: string }; message?: string };
    const msg = String(e?.error?.message ?? e?.message ?? "");

    if (msg.toLowerCase().includes("invalid signature") || e?.http_code === 401) {
      return badRequest(
        "Cloudinary credentials mismatch. Set CLOUDINARY_CLOUD_NAME (or NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME), CLOUDINARY_API_KEY, and the real CLOUDINARY_API_SECRET from your Cloudinary dashboard, then restart the server."
      );
    }
    if (msg.toLowerCase().includes("cloud") && (msg.toLowerCase().includes("disable") || msg.toLowerCase().includes("invalid"))) {
      return badRequest(
        `Cloudinary rejected the request: ${msg}. Check that the cloud name matches your dashboard and the account is active.`
      );
    }
    if (err instanceof Error && err.message.includes("Cloudinary")) {
      return badRequest(err.message);
    }

    console.error("[api/profile/photo] upload failed:", err);
    return serverError();
  }
}
