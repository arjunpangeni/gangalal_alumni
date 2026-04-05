/**
 * Client-safe Cloudinary URL builder (no server-only imports).
 */
export function buildCloudinaryUrl(
  publicIdOrUrl: string,
  options: { width?: number; height?: number; crop?: string; gravity?: string; quality?: string } = {}
): string {
  const { width, height, crop = "fill", gravity, quality = "auto" } = options;
  const transforms = [`f_auto`, `q_${quality}`];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  if (width || height) transforms.push(`c_${crop}`);
  if (gravity) transforms.push(`g_${gravity}`);

  const cloudName =
    typeof process !== "undefined"
      ? (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME)
      : undefined;

  if (!cloudName) return publicIdOrUrl;

  if (publicIdOrUrl.startsWith("http")) {
    return publicIdOrUrl.replace(/\/upload\//, `/upload/${transforms.join(",")}/`);
  }

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms.join(",")}/${publicIdOrUrl}`;
}
