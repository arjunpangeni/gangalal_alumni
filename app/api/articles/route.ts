import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAdmin } from "@/lib/auth-guard";
import { badRequest, serverError, tooManyRequests } from "@/lib/errors";
import { createArticleSchema } from "@/lib/validations/article";
import connectDB from "@/lib/db";
import Article from "@/lib/models/Article";
import User from "@/lib/models/User";
import { escapeRegex, sanitizeInput, hashContent, estimateReadTime, extractPlateText, checkCorsOrigin } from "@/lib/utils";
import { applyRateLimit, writeLimiter } from "@/lib/ratelimit";
import { ingestArticle } from "@/lib/rag";
import slugify from "slugify";

export async function GET(req: NextRequest) {
  if (!checkCorsOrigin(req)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const tag = searchParams.get("tag");
    const q = searchParams.get("q");

    const filter: Record<string, unknown> = { status: "published", deletedAt: null };
    if (tag) filter.tags = tag;
    if (q?.trim()) {
      const trimmed = q.trim();
      const tokens = trimmed.split(/\s+/).filter(Boolean);
      const authorIds =
        tokens.length > 0
          ? await User.find({
              status: "approved",
              $and: tokens.map((t) => ({ name: new RegExp(escapeRegex(t), "i") })),
            }).distinct("_id")
          : [];
      if (authorIds.length > 0) {
        filter.$or = [{ $text: { $search: trimmed } }, { authorId: { $in: authorIds } }];
      } else {
        filter.$text = { $search: trimmed };
      }
    }

    const [articles, total] = await Promise.all([
      Article.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("authorId", "name image")
        .select("title slug excerpt coverImage tags readTime createdAt authorId")
        .lean(),
      Article.countDocuments(filter),
    ]);

    return NextResponse.json({ success: true, data: articles, meta: { page, limit, total } });
  } catch {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  if (!checkCorsOrigin(req)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  try {
    const session = await requireAuth();
    const limited = await applyRateLimit(writeLimiter, session.user!.id!);
    if (limited) return tooManyRequests();

    const body = await req.json();
    const parsed = createArticleSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");

    const { title, content, acl, tags, submitAction } = parsed.data;
    const sanitizedTitle = sanitizeInput(title, 200);
    const plainText = extractPlateText(content as Record<string, unknown>);
    const excerpt = sanitizeInput(plainText.slice(0, 300), 300);
    const readTime = estimateReadTime(plainText);
    const contentHash = hashContent(plainText);

    // Ensure Mongo is connected before doing any queries (prevents server selection timeouts).
    await connectDB();

    let slug = slugify(sanitizedTitle, { lower: true, strict: true }).trim();
    if (!slug) {
      slug = `article-${Date.now()}`;
    }
    const existing = await Article.findOne({ slug }).lean();
    if (existing) slug = `${slug}-${Date.now()}`;

    const authorIsAdmin = isAdmin(session);
    const status = authorIsAdmin
      ? "published"
      : submitAction === "pending"
        ? "pending"
        : "draft";
    const article = await Article.create({
      title: sanitizedTitle,
      slug,
      content,
      excerpt,
      coverImage: parsed.data.coverImage,
      tags: tags ?? [],
      readTime,
      contentHash,
      acl,
      authorId: session.user!.id,
      status,
    });

    if (status === "published") {
      ingestArticle(String(article._id)).catch(console.error);
    }

    return NextResponse.json({ success: true, data: { slug: article.slug } }, { status: 201 });
  } catch (err) {
    console.error("[api/articles] POST failed:", err);
    return serverError();
  }
}
