import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAdmin } from "@/lib/auth-guard";
import { forbidden, serverError, tooManyRequests } from "@/lib/errors";
import connectDB from "@/lib/db";
import Contact, {
  normalizeContactStatus,
  CONTACT_PENDING_STATUS_VALUES,
  CONTACT_RESOLVED_STATUS_VALUES,
} from "@/lib/models/Contact";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (!isAdmin(session)) return forbidden();

    const limited = await applyRateLimit(adminLimiter, session.user!.id!);
    if (limited) return tooManyRequests();

    await connectDB();
    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");
    const q = searchParams.get("q");
    const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Number.parseInt(searchParams.get("limit") ?? "50", 10));

    const filter: Record<string, unknown> = {};
    if (statusParam === "pending") {
      filter.status = { $in: [...CONTACT_PENDING_STATUS_VALUES] };
    } else if (statusParam === "resolved") {
      filter.status = { $in: [...CONTACT_RESOLVED_STATUS_VALUES] };
    }
    if (q?.trim()) {
      const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: regex }, { email: regex }, { subject: regex }];
    }

    const [rows, total] = await Promise.all([
      Contact.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("name email subject message status ip createdAt")
        .lean(),
      Contact.countDocuments(filter),
    ]);

    const data = rows.map((r) => ({
      _id: String(r._id),
      name: r.name as string,
      email: r.email as string,
      subject: r.subject as string,
      message: r.message as string,
      status: normalizeContactStatus(r.status as string | undefined),
      ip: (r.ip as string | undefined) ?? undefined,
      createdAt: (r.createdAt as Date).toISOString(),
    }));

    return NextResponse.json({ success: true, data, meta: { page, limit, total } });
  } catch {
    return serverError();
  }
}
