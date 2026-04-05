import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-revalidate-secret");
  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ success: false, error: "Invalid secret" }, { status: 401 });
  }

  const body = await req.json();
  const { path, tag } = body;

  if (tag) revalidateTag(tag, "default");
  if (path) revalidatePath(path, "page");

  return NextResponse.json({ success: true, revalidated: { path, tag } });
}
