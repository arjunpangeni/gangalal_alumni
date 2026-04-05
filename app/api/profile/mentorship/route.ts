import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { mentorshipUpdateSchema } from "@/lib/validations/user";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { badRequest, serverError } from "@/lib/errors";
import { ingestMemberProfile } from "@/lib/rag";

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await req.json();
    const parsed = mentorshipUpdateSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");

    await connectDB();
    await User.updateOne(
      { _id: session.user!.id },
      {
        $set: {
          availableForMentorship: parsed.data.availableForMentorship,
          mentorshipBio: parsed.data.mentorshipBio ?? "",
          mentorshipSkills: parsed.data.mentorshipSkills ?? [],
        },
      }
    );

    ingestMemberProfile(session.user!.id!).catch(console.error);

    return NextResponse.json({ success: true });
  } catch {
    return serverError();
  }
}
