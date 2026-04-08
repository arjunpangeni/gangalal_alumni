import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { requireAuth, isAdmin } from "@/lib/auth-guard";
import { badRequest, forbidden, notFound, serverError, success } from "@/lib/errors";
import { adminContactStatusPatchSchema } from "@/lib/validations/user";
import connectDB from "@/lib/db";
import Contact, { normalizeContactStatus } from "@/lib/models/Contact";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    if (!isAdmin(session)) return forbidden();

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return badRequest("Invalid id");

    const body = await req.json();
    const parsed = adminContactStatusPatchSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");

    await connectDB();
    const doc = await Contact.findByIdAndUpdate(
      id,
      { $set: { status: parsed.data.status } },
      { returnDocument: "after" }
    )
      .select("name email subject message status ip createdAt")
      .lean();

    if (!doc) return notFound();

    return success({
      _id: String(doc._id),
      name: doc.name as string,
      email: doc.email as string,
      subject: doc.subject as string,
      message: doc.message as string,
      status: normalizeContactStatus(doc.status as string),
      ip: (doc.ip as string | undefined) ?? undefined,
      createdAt: (doc.createdAt as Date).toISOString(),
    });
  } catch {
    return serverError();
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    if (!isAdmin(session)) return forbidden();

    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return badRequest("Invalid id");

    await connectDB();
    const res = await Contact.findByIdAndDelete(id);
    if (!res) return notFound();

    return success({ deleted: true });
  } catch {
    return serverError();
  }
}
