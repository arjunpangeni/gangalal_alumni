import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAdmin, isSuperAdmin } from "@/lib/auth-guard";
import { badRequest, forbidden, notFound, serverError } from "@/lib/errors";
import { adminUserActionSchema, adminUserProfilePutSchema, profileUpdateSchema } from "@/lib/validations/user";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import AuditLog from "@/lib/models/AuditLog";
import { sendApprovalEmail, sendRejectionEmail } from "@/lib/email";
import { getClientIp, sanitizeInput } from "@/lib/utils";
import { ingestMemberProfile } from "@/lib/rag";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAuth();
    if (!isAdmin(session)) return forbidden();

    const { id } = await params;
    await connectDB();
    const u = await User.findById(id).select("-embedding -contentHash").lean();
    if (!u) return notFound();

    return NextResponse.json({ success: true, data: u });
  } catch {
    return serverError();
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await requireAuth();
    if (!isAdmin(session)) return forbidden();

    const body = await req.json();
    const parsed = adminUserProfilePutSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");

    await connectDB();
    const target = await User.findById(id);
    if (!target) return notFound();

    if (target.role === "superadmin" && String(session.user!.id) !== id) {
      return forbidden("Other superadmin accounts can only be changed in the database.");
    }
    if (target.role === "admin" && !isSuperAdmin(session)) {
      return forbidden("Only a super administrator can edit admin account profiles.");
    }

    const d = parsed.data;
    target.name = sanitizeInput(d.name, 100);
    const img = (d.image ?? "").trim();
    target.image = img.length > 0 ? img : undefined;

    target.set("profile", {
      bio: sanitizeInput(d.bio, 500),
      slcSeeBatch: d.slcSeeBatch,
      schoolPeriod: d.schoolPeriod ? sanitizeInput(d.schoolPeriod, 50) : undefined,
      profession: sanitizeInput(d.profession, 100),
      company: d.company ? sanitizeInput(d.company, 100) : undefined,
      permanentAddress: sanitizeInput(d.permanentAddress, 200),
      city: d.city ? sanitizeInput(d.city, 100) : undefined,
      country: d.country ? sanitizeInput(d.country, 100) : undefined,
      linkedin: (d.linkedin ?? "").trim() || undefined,
      facebook: (d.facebook ?? "").trim() || undefined,
      phone: sanitizeInput(d.phone, 20),
    });
    target.set("profileUpdateRequest", undefined);
    await target.save();
    ingestMemberProfile(String(target._id)).catch(console.error);

    await AuditLog.create({
      adminId: session.user!.id,
      action: "admin-edit-profile",
      targetUserId: id,
      ip: getClientIp(req),
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: {
        name: target.name,
        image: target.image,
        status: target.status,
        role: target.role,
        profileUpdateRequest: null,
      },
    });
  } catch {
    return serverError();
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const session = await requireAuth();
    if (!isAdmin(session)) return forbidden();

    const body = await req.json();
    const parsed = adminUserActionSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "Invalid input");

    const { action, reason, role } = parsed.data;

    if (action === "change-role" && !isSuperAdmin(session)) return forbidden();

    await connectDB();
    const target = await User.findById(id);
    if (!target) return notFound();

    const targetIsStaff = target.role === "admin" || target.role === "superadmin";
    if (targetIsStaff && (action === "ban" || action === "reject")) {
      return forbidden("Administrators and super administrators cannot be banned or rejected.");
    }

    if (String(session.user!.id) === id && (action === "ban" || action === "reject")) {
      return badRequest("You cannot perform this action on your own account.");
    }

    if (action === "remove-user") {
      if (targetIsStaff) {
        return forbidden("Staff accounts cannot be removed through this panel. Use the database if needed.");
      }
      if (String(session.user!.id) === id) {
        return badRequest("You cannot remove your own account.");
      }
      const r = (reason ?? "").trim();
      if (r.length < 10) {
        return badRequest("Provide a reason (at least 10 characters) for removing this account.");
      }
      await AuditLog.create({
        adminId: session.user!.id,
        action: "remove-user",
        targetUserId: id,
        reason: r,
        ip: getClientIp(req),
        timestamp: new Date(),
      });
      await User.deleteOne({ _id: id });
      return NextResponse.json({ success: true, data: { removed: true } });
    }

    if (action === "change-role" && role) {
      if (role === "superadmin") return badRequest("Cannot assign superadmin through this action");
      if (target.role === "superadmin") return forbidden("Use the database to change superadmin accounts");
      if (role === "admin" && target.status !== "approved") {
        return badRequest("Only approved members can be promoted to admin");
      }
      if (String(session.user!.id) === id && role === "user") {
        return badRequest("You cannot remove your own admin access");
      }
    }

    if (action === "approve" || action === "unban") {
      target.status = "approved";
      if (action === "unban") target.bannedReason = undefined;
      target.sessionVersion = (target.sessionVersion ?? 0) + 1;
      await target.save();
      ingestMemberProfile(String(target._id)).catch(console.error);
      if (action === "approve") sendApprovalEmail(target.email, target.name).catch(console.error);
    } else if (action === "reject") {
      target.status = "rejected";
      target.sessionVersion = (target.sessionVersion ?? 0) + 1;
      await target.save();
      sendRejectionEmail(target.email, target.name, reason ?? "Application not approved").catch(console.error);
    } else if (action === "ban") {
      target.status = "banned";
      target.bannedReason = reason;
      target.sessionVersion = (target.sessionVersion ?? 0) + 1;
      await target.save();
    } else if (action === "change-role" && role) {
      target.role = role;
      target.sessionVersion = (target.sessionVersion ?? 0) + 1;
      await target.save();
    } else if (action === "approve-profile-update") {
      const pending = target.profileUpdateRequest;
      if (!pending || pending.status !== "pending") {
        return badRequest("No pending profile update for this member.");
      }
      const raw = (pending.data ?? {}) as Record<string, unknown>;
      const { image: pendingImage, ...rest } = raw;
      const profileShape = profileUpdateSchema.omit({ name: true }).shape;
      const profilePatch: Record<string, unknown> = {};
      for (const key of Object.keys(profileShape)) {
        if (key in rest) profilePatch[key] = rest[key];
      }
      const existingProfile =
        (target.toObject({ flattenMaps: true }).profile as Record<string, unknown> | undefined) ?? {};
      target.set("profile", { ...existingProfile, ...profilePatch });
      if (typeof pendingImage === "string" && pendingImage.length > 0) {
        target.image = pendingImage;
      }
      target.set("profileUpdateRequest", undefined);
      await target.save();
      ingestMemberProfile(String(target._id)).catch(console.error);
    } else if (action === "reject-profile-update") {
      if (!target.profileUpdateRequest || target.profileUpdateRequest.status !== "pending") {
        return badRequest("No pending profile update for this member.");
      }
      target.set("profileUpdateRequest", undefined);
      await target.save();
    }

    await AuditLog.create({
      adminId: session.user!.id,
      action,
      targetUserId: id,
      reason,
      ip: getClientIp(req),
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      data: {
        status: target.status,
        role: target.role,
        image: target.image,
        profileUpdateRequest: target.profileUpdateRequest
          ? { status: target.profileUpdateRequest.status }
          : null,
      },
    });
  } catch {
    return serverError();
  }
}
