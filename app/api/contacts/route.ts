import { NextRequest, NextResponse } from "next/server";
import { contactSchema } from "@/lib/validations/user";
import connectDB from "@/lib/db";
import Contact from "@/lib/models/Contact";
import { applyRateLimit, contactLimiter } from "@/lib/ratelimit";
import { badRequest, serverError, tooManyRequests } from "@/lib/errors";
import { sanitizeInput } from "@/lib/utils";
import { getClientIp } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const limited = await applyRateLimit(contactLimiter, ip);
    if (limited) return tooManyRequests();

    const body = await req.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");

    await connectDB();
    await Contact.create({
      name: sanitizeInput(parsed.data.name, 100),
      email: parsed.data.email,
      subject: sanitizeInput(parsed.data.subject, 200),
      message: sanitizeInput(parsed.data.message, 2000),
      ip,
    });

    return NextResponse.json({ success: true });
  } catch {
    return serverError();
  }
}
