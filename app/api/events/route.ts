import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAdmin } from "@/lib/auth-guard";
import { badRequest, forbidden, serverError, tooManyRequests } from "@/lib/errors";
import { createEventSchema } from "@/lib/validations/event";
import connectDB from "@/lib/db";
import Event from "@/lib/models/Event";
import { sanitizeInput } from "@/lib/utils";
import { applyRateLimit, writeLimiter } from "@/lib/ratelimit";
import slugify from "slugify";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));

    const [events, total] = await Promise.all([
      Event.find({ status: "published", deletedAt: null })
        .sort({ startDate: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("title slug description startDate venue capacity tags")
        .lean(),
      Event.countDocuments({ status: "published", deletedAt: null }),
    ]);

    return NextResponse.json({ success: true, data: events, meta: { page, limit, total } });
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
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");

    const sanitizedTitle = sanitizeInput(parsed.data.title, 200);
    let slug = slugify(sanitizedTitle, { lower: true, strict: true });

    // Ensure Mongo is connected before doing any queries.
    await connectDB();

    const existing = await Event.findOne({ slug }).lean();
    if (existing) slug = `${slug}-${Date.now()}`;
    const event = await Event.create({
      ...parsed.data,
      title: sanitizedTitle,
      description: sanitizeInput(parsed.data.description, 5000),
      slug,
      authorId: session.user!.id,
      status: "published",
    });

    return NextResponse.json({ success: true, data: { slug: event.slug } }, { status: 201 });
  } catch (err) {
    console.error("[api/events] POST failed:", err);
    return serverError();
  }
}
