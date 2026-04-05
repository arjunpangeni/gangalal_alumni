import "server-only";
import cloudinary, { assertCloudinaryConfigured, getCloudinaryCloudName } from "@/lib/cloudinary";

/** Only assets under this path prefix may be deleted (matches signed upload folders). */
const MANAGED_PUBLIC_ID_PREFIX = "alumni/";

/**
 * Parse a Cloudinary image delivery URL into cloud name + public_id.
 * Supports optional transformation segments and /v123/ version in the path.
 */
export function publicIdFromDeliveryUrl(urlStr: string): { cloud: string; publicId: string } | null {
  try {
    const url = new URL(urlStr.trim());
    if (!url.hostname.endsWith("res.cloudinary.com")) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 4) return null;
    const [cloud, resource, upload, ...rest] = parts;
    if (!cloud || resource !== "image" || upload !== "upload" || rest.length === 0) return null;

    let pathParts = [...rest];
    const vIdx = pathParts.findIndex((p) => /^v\d+$/i.test(p));
    if (vIdx !== -1) {
      pathParts = pathParts.slice(vIdx + 1);
    } else {
      while (pathParts.length && pathParts[0]!.includes(",")) {
        pathParts = pathParts.slice(1);
      }
    }
    if (!pathParts.length) return null;
    const withExt = pathParts.join("/");
    const publicId = withExt.replace(/\.[^.]+$/i, "");
    if (!publicId.startsWith(MANAGED_PUBLIC_ID_PREFIX)) return null;
    return { cloud, publicId };
  } catch {
    return null;
  }
}

/**
 * Best-effort delete of a prior image when the URL points at this app's Cloudinary account
 * and lives under `alumni/`. Ignores external URLs and configuration errors.
 */
export async function deleteManagedCloudinaryImageByUrl(url: string | null | undefined): Promise<void> {
  if (!url?.trim()) return;
  const parsed = publicIdFromDeliveryUrl(url);
  if (!parsed) return;
  const expectedCloud = getCloudinaryCloudName();
  if (!expectedCloud || parsed.cloud !== expectedCloud) return;
  try {
    assertCloudinaryConfigured();
    const res = await cloudinary.uploader.destroy(parsed.publicId, { invalidate: true });
    if (res.result !== "ok" && res.result !== "not found") {
      console.warn("[cloudinary-delete] unexpected destroy result:", parsed.publicId, res.result);
    }
  } catch (e) {
    console.warn("[cloudinary-delete] destroy failed:", parsed.publicId, e);
  }
}
