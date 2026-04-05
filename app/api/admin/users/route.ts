import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAdmin } from "@/lib/auth-guard";
import { forbidden, serverError } from "@/lib/errors";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";
import { tooManyRequests } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    if (!isAdmin(session)) return forbidden();

    const limited = await applyRateLimit(adminLimiter, session.user!.id!);
    if (limited) return tooManyRequests();

    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const q = searchParams.get("q");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));

    const filter: Record<string, unknown> = {};
    if (status && status !== "all") filter.status = status;
    if (q) {
      const regex = new RegExp(q, "i");
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("name email image role status createdAt lastLogin profileUpdateRequest")
        .lean(),
      User.countDocuments(filter),
    ]);

    return NextResponse.json({ success: true, data: users, meta: { page, limit, total } });
  } catch {
    return serverError();
  }
}
