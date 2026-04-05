import { NextResponse } from "next/server";

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}
export function forbidden(message = "Forbidden") {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}
export function notFound(message = "Not found") {
  return NextResponse.json({ success: false, error: message }, { status: 404 });
}
export function badRequest(message = "Bad request") {
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}
export function serverError(message = "Internal server error") {
  return NextResponse.json({ success: false, error: message }, { status: 500 });
}
export function tooManyRequests(retryAfter?: number) {
  return NextResponse.json(
    { success: false, error: "Too many requests. Please try again later." },
    { status: 429, headers: retryAfter ? { "Retry-After": String(retryAfter) } : undefined }
  );
}
export function success<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}
export function successList<T>(data: T[], meta: { page: number; limit: number; total: number }) {
  return NextResponse.json({ success: true, data, meta }, { status: 200 });
}
export function created<T>(data: T) {
  return NextResponse.json({ success: true, data }, { status: 201 });
}
