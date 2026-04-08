import { NextResponse } from "next/server";
import { requireAuth, isAdmin } from "@/lib/auth-guard";
import { forbidden, serverError, tooManyRequests } from "@/lib/errors";
import connectDB from "@/lib/db";
import Contact, { CONTACT_PENDING_STATUS_VALUES } from "@/lib/models/Contact";
import { applyRateLimit, adminLimiter } from "@/lib/ratelimit";

export async function GET() {
  try {
    const session = await requireAuth();
    if (!isAdmin(session)) return forbidden();

    const limited = await applyRateLimit(adminLimiter, session.user!.id!);
    if (limited) return tooManyRequests();

    await connectDB();
    const pending = await Contact.countDocuments({
      status: { $in: [...CONTACT_PENDING_STATUS_VALUES] },
    });

    return NextResponse.json({ success: true, data: { pending } });
  } catch {
    return serverError();
  }
}
