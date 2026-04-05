import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAdmin } from "@/lib/auth-guard";
import { badRequest, forbidden, serverError, tooManyRequests } from "@/lib/errors";
import { createNoticeSchema } from "@/lib/validations/notice";
import connectDB from "@/lib/db";
import Notice from "@/lib/models/Notice";
import { sanitizeInput } from "@/lib/utils";
import { applyRateLimit, writeLimiter } from "@/lib/ratelimit";
import { checkCorsOrigin } from "@/lib/utils";

export async function GET() {
  try {
    await connectDB();
    const now = new Date();
    const notices = await Notice.find({
      isActive: true,
      deletedAt: null,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
    })
      .sort({ sortOrder: -1, createdAt: -1 })
      .limit(12)
      .select("title body linkUrl linkLabel expiresAt createdAt")
      .lean();
    return NextResponse.json({ success: true, data: notices });
  } catch {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  if (!checkCorsOrigin(req)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  try {
    const session = await requireAuth();
    if (!isAdmin(session)) return forbidden();
    const limited = await applyRateLimit(writeLimiter, session.user!.id!);
    if (limited) return tooManyRequests();

    const body = await req.json();
    const parsed = createNoticeSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");

    await connectDB();
    const doc = await Notice.create({
      title: sanitizeInput(parsed.data.title, 200),
      body: sanitizeInput(parsed.data.body, 3000),
      linkUrl: parsed.data.linkUrl?.trim() || undefined,
      linkLabel: parsed.data.linkLabel?.trim() || undefined,
      isActive: parsed.data.isActive ?? true,
      sortOrder: parsed.data.sortOrder ?? 0,
      expiresAt: parsed.data.expiresAt ?? null,
      authorId: session.user!.id,
    });

    return NextResponse.json({ success: true, data: { id: String(doc._id) } }, { status: 201 });
  } catch {
    return serverError();
  }
}
