import { createHash } from "crypto";
import NepaliDate from "nepali-date-converter";
import sanitizeHtmlLib from "sanitize-html";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sanitizeInput(str: string, maxLen = 50000): string {
  const stripped = sanitizeHtmlLib(str, { allowedTags: [], allowedAttributes: {} });
  return stripped.trim().slice(0, maxLen);
}

export function slugify(text: string): string {
  return text
    .toString().toLowerCase().trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "").replace(/-+$/, "");
}

export function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

export function formatDate(date: Date | string): string {
  const adDate = new Date(date);
  if (Number.isNaN(adDate.getTime())) return "Invalid date";
  return NepaliDate.fromAD(adDate).format("YYYY MMMM DD", "np");
}

export function formatDateShort(date: Date | string): string {
  const adDate = new Date(date);
  if (Number.isNaN(adDate.getTime())) return "Invalid date";
  return NepaliDate.fromAD(adDate).format("DD MMM, YYYY", "en");
}

export function formatDateDayMonth(date: Date | string): { day: string; month: string } {
  const adDate = new Date(date);
  if (Number.isNaN(adDate.getTime())) return { day: "--", month: "---" };
  const bs = NepaliDate.fromAD(adDate);
  return {
    day: bs.format("DD", "en"),
    month: bs.format("MMMM", "en").toLowerCase(),
  };
}

export function getBsYear(date: Date | string = new Date()): string {
  const adDate = new Date(date);
  if (Number.isNaN(adDate.getTime())) return "";
  return NepaliDate.fromAD(adDate).format("YYYY", "en");
}

export function formatRelativeDate(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

export function extractPlateText(node: Record<string, unknown> | unknown[]): string {
  if (Array.isArray(node)) return node.map((n) => extractPlateText(n as Record<string, unknown>)).join(" ");
  if (typeof node === "object" && node !== null) {
    const obj = node as Record<string, unknown>;
    if (typeof obj.text === "string") return obj.text;
    if (Array.isArray(obj.children)) return extractPlateText(obj.children as Record<string, unknown>[]);
  }
  return "";
}

export function estimateReadTime(content: string | object): number {
  const text = typeof content === "string" ? content : extractPlateText(content as Record<string, unknown>);
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / 200);
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

/** True when browser Origin matches app URL or same loopback host (localhost / 127.0.0.1 / ::1) and port. */
export function checkCorsOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!origin || !appUrl) return true;
  if (origin === appUrl) return true;
  try {
    const o = new URL(origin);
    const a = new URL(appUrl);
    if (o.protocol !== a.protocol) return false;
    const portO = o.port || (o.protocol === "https:" ? "443" : "80");
    const portA = a.port || (a.protocol === "https:" ? "443" : "80");
    if (portO !== portA) return false;
    const loopback = new Set(["localhost", "127.0.0.1", "[::1]"]);
    if (loopback.has(o.hostname) && loopback.has(a.hostname)) return true;
    return o.hostname === a.hostname;
  } catch {
    return false;
  }
}
