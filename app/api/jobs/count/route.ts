import { NextRequest, NextResponse } from "next/server";
import { checkCorsOrigin } from "@/lib/utils";
import { countActivePublishedJobs } from "@/lib/server/public-listings";
import { serverError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  if (!checkCorsOrigin(req)) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  try {
    const count = await countActivePublishedJobs();
    return NextResponse.json({ success: true, data: { count } });
  } catch {
    return serverError();
  }
}
