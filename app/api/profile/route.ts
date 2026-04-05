import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAdmin, isApprovedAccount } from "@/lib/auth-guard";
import { profileUpdateSchema } from "@/lib/validations/user";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { badRequest, serverError } from "@/lib/errors";
import { applyRateLimit, writeLimiter } from "@/lib/ratelimit";
import { tooManyRequests } from "@/lib/errors";
import { ingestMemberProfile } from "@/lib/rag";

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth();
    const limited = await applyRateLimit(writeLimiter, session.user!.id!);
    if (limited) return tooManyRequests();

    const body = await req.json();
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");

    const { name, ...profileOnly } = parsed.data;
    const displayName = name.trim();

    await connectDB();
    if (isAdmin(session) || isApprovedAccount(session)) {
      await User.updateOne(
        { _id: session.user!.id },
        {
          $set: {
            name: displayName,
            profile: profileOnly,
          },
          $unset: { profileUpdateRequest: 1 },
        }
      );
      ingestMemberProfile(session.user!.id!).catch(console.error);
    } else {
      const u = await User.findById(session.user!.id).lean();
      const prevPending =
        u?.profileUpdateRequest?.status === "pending"
          ? ((u.profileUpdateRequest.data as Record<string, unknown>) ?? {})
          : {};
      const mergedData = { ...prevPending, ...profileOnly };

      await User.updateOne(
        { _id: session.user!.id },
        {
          $set: {
            name: displayName,
            profileUpdateRequest: {
              data: mergedData,
              status: "pending",
              requestedAt: new Date(),
            },
          },
        }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return serverError();
  }
}
