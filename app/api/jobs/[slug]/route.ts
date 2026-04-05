import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireAuth, requireOwnership, isAdmin } from "@/lib/auth-guard";
import { badRequest, forbidden, notFound, serverError, tooManyRequests } from "@/lib/errors";
import { jobActionSchema, updateJobSchema } from "@/lib/validations/job";
import connectDB from "@/lib/db";
import Job from "@/lib/models/Job";
import type { IJob } from "@/lib/models/Job";
import mongoose from "mongoose";
import { sanitizeInput, checkCorsOrigin } from "@/lib/utils";
import { applyRateLimit, writeLimiter } from "@/lib/ratelimit";
import { ingestJob } from "@/lib/rag";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectDB();
  const job = await Job.findOne({ slug, deletedAt: null })
    .populate("authorId", "name email")
    .lean();
  if (!job) return notFound();

  const doc = job as IJob & {
    authorId?: mongoose.Types.ObjectId | { _id?: mongoose.Types.ObjectId };
  };
  if (doc.status === "published") {
    return NextResponse.json({ success: true, data: job });
  }

  const session = await auth();
  if (!session?.user?.id) return forbidden();
  const authorRef = doc.authorId;
  const authorIdStr =
    typeof authorRef === "object" && authorRef !== null && "_id" in authorRef
      ? String((authorRef as { _id: mongoose.Types.ObjectId })._id)
      : String(authorRef ?? "");
  if (!isAdmin(session) && authorIdStr !== session.user.id) return forbidden();

  return NextResponse.json({ success: true, data: job });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!checkCorsOrigin(req)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  const { slug } = await params;
  try {
    const session = await requireAuth("approved");
    const limited = await applyRateLimit(writeLimiter, session.user!.id!);
    if (limited) return tooManyRequests();

    await connectDB();
    const job = await Job.findOne({ slug, deletedAt: null });
    if (!job) return notFound();
    try {
      requireOwnership(session, { authorId: (job as IJob).authorId as mongoose.Types.ObjectId });
    } catch {
      return forbidden();
    }

    const body = await req.json();
    const parsed = updateJobSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");

    if (parsed.data.applyUrl !== undefined) {
      const u = parsed.data.applyUrl.trim();
      if (
        u &&
        !/^https?:\/\/.+/i.test(u) &&
        !/^mailto:.+/i.test(u)
      ) {
        return badRequest("Apply link must be a valid URL or mailto: address");
      }
    }

    if (!isAdmin(session)) {
      if (parsed.data.status === "published" || parsed.data.status === "archived") {
        return forbidden("Only admins can publish or archive jobs.");
      }
    }

    Object.assign(job, parsed.data);
    const doc = job as IJob;

    if (parsed.data.title !== undefined) doc.title = sanitizeInput(parsed.data.title, 200);
    if (parsed.data.description !== undefined) doc.description = sanitizeInput(parsed.data.description, 5000);
    if (parsed.data.educationOrSkills !== undefined) {
      const v = (parsed.data.educationOrSkills ?? "").trim();
      doc.educationOrSkills = v ? sanitizeInput(v, 2000) : undefined;
    }
    if (parsed.data.company !== undefined) doc.company = sanitizeInput(parsed.data.company, 100);
    if (parsed.data.location !== undefined) doc.location = sanitizeInput(parsed.data.location, 100);
    if (parsed.data.applyUrl !== undefined) {
      const u = (parsed.data.applyUrl ?? "").trim();
      doc.applyUrl = u || undefined;
    }
    if (parsed.data.applyEmail !== undefined) {
      const e = (parsed.data.applyEmail ?? "").trim().toLowerCase();
      doc.applyEmail = e || undefined;
    }
    if (parsed.data.applyPhone !== undefined) {
      const p = (parsed.data.applyPhone ?? "").trim();
      doc.applyPhone = p || undefined;
    }
    doc.salary = sanitizeInput(parsed.data.salary, 100);
    doc.expiresAt = parsed.data.expiresAt;

    await job.save();

    if ((job as IJob).status === "published") {
      ingestJob(String(job._id)).catch(console.error);
    }

    return NextResponse.json({ success: true, data: { slug: (job as IJob).slug } });
  } catch {
    return serverError();
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!checkCorsOrigin(req)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  const { slug } = await params;
  try {
    const session = await requireAuth("approved");
    await connectDB();
    const job = await Job.findOne({ slug, deletedAt: null });
    if (!job) return notFound();

    const body = await req.json();
    const parsed = jobActionSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");
    const { action } = parsed.data;

    if (!isAdmin(session)) return forbidden();

    if (action === "approve") {
      (job as IJob).status = "published";
      (job as IJob).rejectionReason = undefined;
      await job.save();
      ingestJob(String(job._id)).catch(console.error);
    } else if (action === "reject") {
      (job as IJob).status = "archived";
      (job as IJob).rejectionReason = parsed.data.reason;
      await job.save();
    }

    return NextResponse.json({ success: true, data: { status: (job as IJob).status } });
  } catch {
    return serverError();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!checkCorsOrigin(req)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  const { slug } = await params;
  try {
    const session = await requireAuth("approved");
    await connectDB();
    const job = await Job.findOne({ slug, deletedAt: null });
    if (!job) return notFound();

    if (!isAdmin(session)) {
      try {
        requireOwnership(session, { authorId: (job as IJob).authorId as mongoose.Types.ObjectId });
      } catch {
        return forbidden();
      }
    }

    (job as IJob).deletedAt = new Date();
    await job.save();
    return NextResponse.json({ success: true });
  } catch {
    return serverError();
  }
}
