import { auth } from "./auth";
import { forbidden, unauthorized } from "./errors";
import type { Session } from "next-auth";

export type Role = "user" | "admin" | "superadmin";

const ROLE_LEVEL: Record<Role, number> = { user: 0, admin: 1, superadmin: 2 };

export async function getServerSession(): Promise<Session | null> {
  return await auth();
}

export async function requireAuth(minStatus?: "approved"): Promise<Session> {
  const session = await auth();
  if (!session?.user) throw Object.assign(unauthorized(), { _isResponse: true });
  if (minStatus === "approved" && session.user.status !== "approved") {
    throw Object.assign(forbidden("Account not approved"), { _isResponse: true });
  }
  return session;
}

export function requireRole(session: Session, minRole: Role): void {
  const userRole = (session.user.role as Role) ?? "user";
  if ((ROLE_LEVEL[userRole] ?? 0) < ROLE_LEVEL[minRole]) {
    throw Object.assign(forbidden(`Requires role: ${minRole}`), { _isResponse: true });
  }
}

export function requireOwnership(
  session: Session,
  doc: { authorId?: string | object; createdBy?: string | object }
): void {
  const userRole = (session.user.role as Role) ?? "user";
  if (ROLE_LEVEL[userRole] >= ROLE_LEVEL["admin"]) return;
  const ownerId = String(doc.authorId ?? doc.createdBy ?? "");
  if (ownerId !== session.user.id) {
    throw Object.assign(forbidden("You don't own this resource"), { _isResponse: true });
  }
}

export function isAdmin(session: Session | null): boolean {
  if (!session?.user) return false;
  return (ROLE_LEVEL[session.user.role as Role] ?? 0) >= ROLE_LEVEL["admin"];
}

/** Approved members may edit profile/photo without an admin review step. */
export function isApprovedAccount(session: Session | null): boolean {
  return session?.user?.status === "approved";
}

export function isSuperAdmin(session: Session | null): boolean {
  return session?.user?.role === "superadmin";
}
