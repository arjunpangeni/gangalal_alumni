import "server-only";
import { v2 as cloudinary } from "cloudinary";

/** Server name; falls back to NEXT_PUBLIC so one env var can work in dev. */
function getCloudName(): string | undefined {
  return (
    process.env.CLOUDINARY_CLOUD_NAME?.trim() ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() ||
    undefined
  );
}

/** For URL checks (e.g. delete-by-URL) without requiring full API credentials. */
export function getCloudinaryCloudName(): string | undefined {
  return getCloudName();
}

const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

function applyCloudinaryConfig(): { cloudName: string; apiKey: string; apiSecret: string } {
  const cloudName = getCloudName();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME (or NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME), CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env.local, then restart the dev server."
    );
  }
  if (apiSecret === "**********" || /^\*+$/.test(apiSecret)) {
    throw new Error(
      "CLOUDINARY_API_SECRET looks like a placeholder. Paste the real API Secret from the Cloudinary dashboard."
    );
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  return { cloudName, apiKey, apiSecret };
}

export const CLOUDINARY_FOLDERS = {
  avatars: "alumni/avatars",
  articles: "alumni/articles",
  covers: "alumni/covers",
  gallery: "alumni/gallery",
  events: "alumni/events",
  committee: "alumni/committee",
} as const;

export type CloudinaryPurpose = keyof typeof CLOUDINARY_FOLDERS;

export function assertCloudinaryConfigured(): void {
  applyCloudinaryConfig();
}

/** Signed upload params. The client MUST send the returned `folder` exactly (signature binds to it). */
export function generateSignedUploadParams(purpose: CloudinaryPurpose = "articles") {
  const { cloudName, apiKey, apiSecret } = applyCloudinaryConfig();
  const timestamp = Math.round(new Date().getTime() / 1000);
  const folderPath = CLOUDINARY_FOLDERS[purpose];
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder: folderPath }, apiSecret);
  return {
    signature: String(signature),
    timestamp: String(timestamp),
    api_key: apiKey,
    cloud_name: cloudName,
    folder: folderPath,
  };
}

export default cloudinary;
