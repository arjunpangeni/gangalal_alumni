import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAuth, isSuperAdmin } from "@/lib/auth-guard";
import { badRequest, forbidden, serverError, tooManyRequests } from "@/lib/errors";
import { committeeMemberCreateSchema } from "@/lib/validations/committee";
import connectDB from "@/lib/db";
import CommitteeMember from "@/lib/models/CommitteeMember";
import { sanitizeInput } from "@/lib/utils";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";

function serialize(doc: { _id: unknown; name: string; post: string; photo?: string; sortOrder: number }) {
  const photo = (doc.photo ?? "").trim();
  return {
    _id: String(doc._id),
    name: doc.name,
    post: doc.post,
    photo: photo.length > 0 ? photo : undefined,
    sortOrder: doc.sortOrder ?? 0,
  };
}

export async function GET() {
  try {
    const session = await requireAuth();
    if (!isSuperAdmin(session)) return forbidden();

    const limited = await applyRateLimit(adminLimiter, session.user!.id!);
    if (limited) return tooManyRequests();

    await connectDB();
    const rows = await CommitteeMember.find({})
      .sort({ sortOrder: -1, createdAt: -1 })
      .select("name post photo sortOrder")
      .lean();

    return NextResponse.json({
      success: true,
      data: rows.map((r) =>
        serialize({
          _id: r._id,
          name: r.name as string,
          post: r.post as string,
          photo: r.photo as string | undefined,
          sortOrder: (r.sortOrder as number) ?? 0,
        })
      ),
    });
  } catch {
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (!isSuperAdmin(session)) return forbidden();

    const limited = await applyRateLimit(adminLimiter, session.user!.id!);
    if (limited) return tooManyRequests();

    const body = await req.json();
    const parsed = committeeMemberCreateSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");

    await connectDB();
    const photoTrim = (parsed.data.photo ?? "").trim();
    const doc = await CommitteeMember.create({
      name: sanitizeInput(parsed.data.name, 120),
      post: sanitizeInput(parsed.data.post, 120),
      photo: photoTrim.length > 0 ? photoTrim : undefined,
      sortOrder: parsed.data.sortOrder ?? 0,
    });

    revalidatePath("/about", "page");

    return NextResponse.json(
      {
        success: true,
        data: serialize({
          _id: doc._id,
          name: doc.name,
          post: doc.post,
          photo: doc.photo,
          sortOrder: doc.sortOrder ?? 0,
        }),
      },
      { status: 201 }
    );
  } catch {
    return serverError();
  }
}
