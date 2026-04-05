import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAdmin } from "@/lib/auth-guard";
import { badRequest, serverError, tooManyRequests } from "@/lib/errors";
import { createJobSchema } from "@/lib/validations/job";
import connectDB from "@/lib/db";
import Job from "@/lib/models/Job";
import { sanitizeInput, checkCorsOrigin } from "@/lib/utils";
import { applyRateLimit, writeLimiter } from "@/lib/ratelimit";
import { ingestJob } from "@/lib/rag";
import slugify from "slugify";

export async function GET(req: NextRequest) {
  if (!checkCorsOrigin(req)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const type = searchParams.get("type");
    const q = searchParams.get("q")?.trim();
    const filter: Record<string, unknown> = { status: "published", deletedAt: null };
    if (type) filter.type = type;
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { company: { $regex: q, $options: "i" } },
        { location: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
        { tags: { $in: [new RegExp(q, "i")] } },
      ];
    }

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("title slug company location type salary applyUrl applyEmail applyPhone tags educationOrSkills expiresAt")
        .lean(),
      Job.countDocuments(filter),
    ]);

    return NextResponse.json({ success: true, data: jobs, meta: { page, limit, total } });
  } catch {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  if (!checkCorsOrigin(req)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  try {
    const session = await requireAuth("approved");
    const limited = await applyRateLimit(writeLimiter, session.user!.id!);
    if (limited) return tooManyRequests();

    const body = await req.json();
    const parsed = createJobSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");

    const sanitizedTitle = sanitizeInput(parsed.data.title, 200);
    let slug = slugify(sanitizedTitle, { lower: true, strict: true });
    if (!slug) slug = `job-${Date.now()}`;

    await connectDB();

    const existing = await Job.findOne({ slug }).lean();
    if (existing) slug = `${slug}-${Date.now()}`;

    const authorIsAdmin = isAdmin(session);
    const status = authorIsAdmin
      ? "published"
      : parsed.data.submitAction === "pending"
        ? "pending"
        : "draft";

    const {
      submitAction: _sa,
      applyUrl: _rawUrl,
      applyEmail: _rawEmail,
      applyPhone: _rawPhone,
      ...rest
    } = parsed.data;

    const urlTrim = (_rawUrl ?? "").trim();
    const emailTrim = (_rawEmail ?? "").trim();
    const phoneTrim = (_rawPhone ?? "").trim();

    const job = await Job.create({
      ...rest,
      title: sanitizedTitle,
      company: sanitizeInput(parsed.data.company, 100),
      location: sanitizeInput(parsed.data.location, 100),
      description: sanitizeInput(parsed.data.description, 5000),
      educationOrSkills: parsed.data.educationOrSkills
        ? sanitizeInput(parsed.data.educationOrSkills, 2000)
        : undefined,
      salary: sanitizeInput(parsed.data.salary, 100),
      slug,
      authorId: session.user!.id,
      status,
      ...(urlTrim ? { applyUrl: urlTrim } : {}),
      ...(emailTrim ? { applyEmail: emailTrim } : {}),
      ...(phoneTrim ? { applyPhone: phoneTrim } : {}),
      expiresAt: parsed.data.expiresAt,
    });

    if (status === "published") {
      ingestJob(String(job._id)).catch(console.error);
    }

    return NextResponse.json({ success: true, data: { slug: job.slug } }, { status: 201 });
  } catch (err) {
    console.error("[api/jobs] POST failed:", err);
    return serverError();
  }
}
