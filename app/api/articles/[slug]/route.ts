import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireAuth, requireOwnership, isAdmin } from "@/lib/auth-guard";
import { sanitizeInput, hashContent, estimateReadTime, extractPlateText } from "@/lib/utils";
import { badRequest, notFound, serverError, forbidden, tooManyRequests } from "@/lib/errors";
import { articleActionSchema, updateArticleSchema } from "@/lib/validations/article";
import connectDB from "@/lib/db";
import Article from "@/lib/models/Article";
import { applyRateLimit, writeLimiter } from "@/lib/ratelimit";
import { ingestArticle } from "@/lib/rag";
import { checkCorsOrigin } from "@/lib/utils";
import { deleteManagedCloudinaryImageByUrl } from "@/lib/cloudinary-delete";
import type { IArticle } from "@/lib/models/Article";
import mongoose from "mongoose";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectDB();
  const article = await Article.findOne({ slug, deletedAt: null })
    .populate("authorId", "name image email")
    .lean();
  if (!article) return notFound();

  const doc = article as IArticle & {
    authorId?: mongoose.Types.ObjectId | { _id?: mongoose.Types.ObjectId; name?: string; image?: string; email?: string };
  };
  if (doc.status === "published") {
    return NextResponse.json({ success: true, data: article });
  }

  const session = await auth();
  if (!session?.user?.id) return forbidden();
  const authorRef = doc.authorId;
  const authorIdStr =
    typeof authorRef === "object" && authorRef !== null && "_id" in authorRef
      ? String((authorRef as { _id: mongoose.Types.ObjectId })._id)
      : String(authorRef ?? "");
  if (!isAdmin(session) && authorIdStr !== session.user.id) return forbidden();

  return NextResponse.json({ success: true, data: article });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!checkCorsOrigin(req)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  const { slug } = await params;
  try {
    const session = await requireAuth();
    const limited = await applyRateLimit(writeLimiter, session.user!.id!);
    if (limited) return tooManyRequests();

    await connectDB();
    const article = await Article.findOne({ slug, deletedAt: null });
    if (!article) return notFound();
    try {
      requireOwnership(session, { authorId: (article as IArticle).authorId as mongoose.Types.ObjectId });
    } catch {
      return forbidden();
    }

    const body = await req.json();
    const parsed = updateArticleSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");

    const wasPublished = (article as IArticle).status === "published";

    if (!isAdmin(session)) {
      if (parsed.data.status === "published" || parsed.data.status === "archived") {
        return forbidden("Only admins can publish or archive articles.");
      }
    }

    const previousCoverImage = (article as IArticle).coverImage;

    Object.assign(article, parsed.data);

    const doc = article as IArticle;
    if (!isAdmin(session) && wasPublished) {
      doc.status = "pending";
    }
    if (parsed.data.content !== undefined) {
      const plainText = extractPlateText(parsed.data.content as Record<string, unknown>);
      doc.excerpt = sanitizeInput(plainText.slice(0, 300), 300);
      doc.readTime = estimateReadTime(plainText);
      doc.contentHash = hashContent(plainText);
    }
    if (parsed.data.title !== undefined) {
      doc.title = sanitizeInput(parsed.data.title, 200);
    }

    await article.save();

    if ((article as IArticle).status === "published") {
      ingestArticle(String(article._id)).catch(console.error);
    }

    const nextCover = parsed.data.coverImage;
    if (nextCover !== undefined && previousCoverImage && previousCoverImage !== nextCover) {
      void deleteManagedCloudinaryImageByUrl(previousCoverImage);
    }

    return NextResponse.json({ success: true, data: { slug: (article as IArticle).slug } });
  } catch {
    return serverError();
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!checkCorsOrigin(req)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  const { slug } = await params;
  try {
    const session = await requireAuth();
    await connectDB();
    const article = await Article.findOne({ slug, deletedAt: null });
    if (!article) return notFound();

    const body = await req.json();
    const parsed = articleActionSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");

    const { action } = parsed.data;

    if (action === "request-delete") {
      try {
        requireOwnership(session, { authorId: (article as IArticle).authorId as mongoose.Types.ObjectId });
      } catch {
        return forbidden();
      }
      (article as IArticle).deleteRequestedAt = new Date();
      await article.save();
      return NextResponse.json({ success: true });
    }

    if (!isAdmin(session)) return forbidden();

    if (action === "approve") {
      (article as IArticle).status = "published";
      (article as IArticle).rejectionReason = undefined;
      await article.save();
      ingestArticle(String(article._id)).catch(console.error);
    } else if (action === "reject") {
      (article as IArticle).status = "archived";
      (article as IArticle).rejectionReason = parsed.data.reason;
      await article.save();
    }

    return NextResponse.json({ success: true, data: { status: (article as IArticle).status } });
  } catch {
    return serverError();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!checkCorsOrigin(req)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  const { slug } = await params;
  try {
    const session = await requireAuth();
    await connectDB();
    const article = await Article.findOne({ slug, deletedAt: null });
    if (!article) return notFound();

    if (!isAdmin(session)) {
      try {
        requireOwnership(session, { authorId: (article as IArticle).authorId as mongoose.Types.ObjectId });
      } catch {
        return forbidden();
      }
    }

    const coverToRemove = (article as IArticle).coverImage;
    (article as IArticle).deletedAt = new Date();
    await article.save();
    void deleteManagedCloudinaryImageByUrl(coverToRemove);
    return NextResponse.json({ success: true });
  } catch {
    return serverError();
  }
}
