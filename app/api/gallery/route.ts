import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAdmin } from "@/lib/auth-guard";
import { badRequest, forbidden, serverError, tooManyRequests } from "@/lib/errors";
import { createAlbumSchema } from "@/lib/validations/gallery";
import connectDB from "@/lib/db";
import Album from "@/lib/models/Album";
import { sanitizeInput } from "@/lib/utils";
import { applyRateLimit, writeLimiter } from "@/lib/ratelimit";
import slugify from "slugify";

export async function GET() {
  try {
    await connectDB();
    const albums = await Album.find({ status: "published", deletedAt: null })
      .sort({ createdAt: -1 })
      .select("title slug description coverImage photos")
      .lean();
    return NextResponse.json({ success: true, data: albums });
  } catch {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (!isAdmin(session)) return forbidden();
    const limited = await applyRateLimit(writeLimiter, session.user!.id!);
    if (limited) return tooManyRequests();

    const body = await req.json();
    const parsed = createAlbumSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");

    const sanitizedTitle = sanitizeInput(parsed.data.title, 200);
    let slug = slugify(sanitizedTitle, { lower: true, strict: true });
    const existing = await Album.findOne({ slug }).lean();
    if (existing) slug = `${slug}-${Date.now()}`;

    await connectDB();
    const album = await Album.create({
      ...parsed.data,
      title: sanitizedTitle,
      slug,
      authorId: session.user!.id,
    });

    return NextResponse.json({ success: true, data: { slug: album.slug, id: album._id } }, { status: 201 });
  } catch {
    return serverError();
  }
}
