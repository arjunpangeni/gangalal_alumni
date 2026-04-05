import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAdmin } from "@/lib/auth-guard";
import { badRequest, forbidden, notFound, serverError, tooManyRequests } from "@/lib/errors";
import { updateNoticeSchema } from "@/lib/validations/notice";
import connectDB from "@/lib/db";
import Notice from "@/lib/models/Notice";
import type { INotice } from "@/lib/models/Notice";
import { sanitizeInput, checkCorsOrigin } from "@/lib/utils";
import { applyRateLimit, writeLimiter } from "@/lib/ratelimit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkCorsOrigin(req)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  try {
    const session = await requireAuth();
    if (!isAdmin(session)) return forbidden();
    const limited = await applyRateLimit(writeLimiter, session.user!.id!);
    if (limited) return tooManyRequests();

    const body = await req.json();
    const parsed = updateNoticeSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");

    await connectDB();
    const notice = await Notice.findOne({ _id: id, deletedAt: null });
    if (!notice) return notFound();

    const doc = notice as INotice;
    if (parsed.data.title !== undefined) doc.title = sanitizeInput(parsed.data.title, 200);
    if (parsed.data.body !== undefined) doc.body = sanitizeInput(parsed.data.body, 3000);
    if (parsed.data.linkUrl !== undefined) doc.linkUrl = parsed.data.linkUrl?.trim() || undefined;
    if (parsed.data.linkLabel !== undefined) doc.linkLabel = parsed.data.linkLabel?.trim() || undefined;
    if (parsed.data.isActive !== undefined) doc.isActive = parsed.data.isActive;
    if (parsed.data.sortOrder !== undefined) doc.sortOrder = parsed.data.sortOrder;
    if (parsed.data.expiresAt !== undefined) {
      doc.expiresAt = parsed.data.expiresAt;
    }

    await notice.save();
    return NextResponse.json({ success: true });
  } catch {
    return serverError();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!checkCorsOrigin(req)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  try {
    const session = await requireAuth();
    if (!isAdmin(session)) return forbidden();

    await connectDB();
    const notice = await Notice.findOne({ _id: id, deletedAt: null });
    if (!notice) return notFound();

    (notice as INotice).deletedAt = new Date();
    await notice.save();
    return NextResponse.json({ success: true });
  } catch {
    return serverError();
  }
}
