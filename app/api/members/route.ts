import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { serverError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const after = searchParams.get("after");

    const filter: Record<string, unknown> = { status: "approved" };

    if (q) {
      const regex = new RegExp(q, "i");
      filter.$or = [
        { name: regex },
        { "profile.profession": regex },
        { "profile.city": regex },
        { "profile.company": regex },
      ];
    }

    if (after) {
      filter._id = { $gt: after };
    }

    const users = await User.find(filter)
      .sort({ _id: 1 })
      .limit(limit + 1)
      .select("name image profile")
      .lean();

    const hasMore = users.length > limit;
    const data = hasMore ? users.slice(0, limit) : users;
    const nextCursor = hasMore ? String(data[data.length - 1]._id) : null;

    return NextResponse.json({ success: true, data, meta: { nextCursor, limit } });
  } catch {
    return serverError();
  }
}
