import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import {
  CLOUDINARY_FOLDERS,
  generateSignedUploadParams,
  type CloudinaryPurpose,
} from "@/lib/cloudinary";

function parsePurpose(body: unknown): CloudinaryPurpose {
  if (!body || typeof body !== "object") return "articles";
  const p = (body as { purpose?: string }).purpose;
  if (p && p in CLOUDINARY_FOLDERS) return p as CloudinaryPurpose;
  return "articles";
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    let body: unknown = {};
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      try {
        body = await req.json();
      } catch {
        /* ignore invalid json */
      }
    }

    const purpose = parsePurpose(body);
    const params = generateSignedUploadParams(purpose);
    return NextResponse.json(params);
  } catch (e) {
    if (e && typeof e === "object" && "_isResponse" in e && (e as { _isResponse?: boolean })._isResponse) {
      return e as unknown as NextResponse;
    }
    console.error("[api/upload/sign]", e);
    const message = e instanceof Error ? e.message : "Could not create upload signature.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
