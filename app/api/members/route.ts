import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { escapeRegex } from "@/lib/utils";
import { serverError } from "@/lib/errors";

function buildMemberFilter(params: {
  q?: string;
  batch?: string;
  country?: string;
  city?: string;
  profession?: string;
  after?: string | null;
}) {
  const clauses: object[] = [{ status: "approved" as const }];

  const q = params.q?.trim();
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    const qOr: object[] = [
      { name: rx },
      { "profile.profession": rx },
      { "profile.city": rx },
      { "profile.company": rx },
      { "profile.country": rx },
      { "profile.batch": rx },
    ];
    if (/^\d+$/.test(q)) {
      qOr.push({ "profile.slcSeeBatch": parseInt(q, 10) });
    }
    clauses.push({ $or: qOr });
  }

  const batch = params.batch?.trim();
  if (batch) {
    const br = new RegExp(escapeRegex(batch), "i");
    const batchOr: object[] = [{ "profile.batch": br }];
    if (/^\d+$/.test(batch)) {
      batchOr.push({ "profile.slcSeeBatch": parseInt(batch, 10) });
    }
    clauses.push({ $or: batchOr });
  }

  const country = params.country?.trim();
  if (country) {
    clauses.push({ "profile.country": new RegExp(escapeRegex(country), "i") });
  }

  const city = params.city?.trim();
  if (city) {
    clauses.push({ "profile.city": new RegExp(escapeRegex(city), "i") });
  }

  const profession = params.profession?.trim();
  if (profession) {
    clauses.push({ "profile.profession": new RegExp(escapeRegex(profession), "i") });
  }

  if (params.after) {
    clauses.push({ _id: { $gt: params.after } });
  }

  return clauses.length === 1 ? clauses[0] : { $and: clauses };
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";
    const batch = searchParams.get("batch") ?? "";
    const country = searchParams.get("country") ?? "";
    const city = searchParams.get("city") ?? "";
    const profession = searchParams.get("profession") ?? "";
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));
    const after = searchParams.get("after");

    const filter = buildMemberFilter({ q, batch, country, city, profession, after });

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
