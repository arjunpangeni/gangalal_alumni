/**
 * Browser upload: server signs params; client POSTs file to Cloudinary via XHR for progress events.
 * Always use the `folder` returned by /api/upload/sign — it must match the signature.
 */

export type CloudinarySignPurpose = "articles" | "covers" | "gallery" | "events" | "avatars" | "committee";

export type CloudinaryUploadResult = { secureUrl: string; publicId: string };

/** Percent 0–100; optional phase for UI copy */
export type CloudinaryUploadProgress = (percent: number, phase: "signing" | "uploading") => void;

async function fetchSign(purpose: CloudinarySignPurpose) {
  const signRes = await fetch("/api/upload/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ purpose }),
  });

  const signJson = (await signRes.json()) as {
    success?: boolean;
    error?: string;
    signature?: string;
    timestamp?: string;
    cloud_name?: string;
    api_key?: string;
    folder?: string;
  };

  if (!signRes.ok) {
    throw new Error(signJson.error ?? "Could not sign upload (check login and Cloudinary env).");
  }

  const { signature, timestamp, cloud_name, api_key, folder } = signJson;
  if (!signature || !timestamp || !api_key || !cloud_name || !folder) {
    throw new Error(
      "Upload signing failed: incomplete response. Check CLOUDINARY_* and NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in .env.local."
    );
  }

  return { signature, timestamp, cloud_name, api_key, folder };
}

function uploadFileToCloudinaryXHR(
  formData: FormData,
  cloudName: string,
  onProgress?: CloudinaryUploadProgress
): Promise<CloudinaryUploadResult> {
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        const frac = e.loaded / e.total;
        onProgress?.(8 + Math.round(frac * 92), "uploading");
      }
    };
    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`Cloudinary upload failed (${xhr.status})`));
        return;
      }
      let uploadData: { secure_url?: string; public_id?: string; error?: { message?: string } };
      try {
        uploadData = JSON.parse(xhr.responseText || "{}") as typeof uploadData;
      } catch {
        reject(new Error("Invalid response from Cloudinary"));
        return;
      }
      if (!uploadData.secure_url || !uploadData.public_id) {
        reject(new Error(uploadData.error?.message ?? "Unknown Cloudinary error"));
        return;
      }
      onProgress?.(100, "uploading");
      resolve({ secureUrl: uploadData.secure_url, publicId: uploadData.public_id });
    };
    xhr.onerror = () => reject(new Error("Network error during Cloudinary upload."));
    xhr.send(formData);
  });
}

async function uploadToCloudinary(
  file: File,
  purpose: CloudinarySignPurpose,
  onProgress?: CloudinaryUploadProgress
): Promise<CloudinaryUploadResult> {
  onProgress?.(0, "signing");
  const { signature, timestamp, cloud_name, api_key, folder } = await fetchSign(purpose);
  onProgress?.(5, "uploading");

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", api_key);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature);
  formData.append("folder", folder);

  return uploadFileToCloudinaryXHR(formData, cloud_name, onProgress);
}

/** Upload many files; `onProgress` receives overall 0–100 across all files. */
export async function uploadImagesToCloudinaryWithIds(
  files: File[],
  purpose: CloudinarySignPurpose,
  onOverallProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult[]> {
  const list = files.filter((f) => f.type.startsWith("image/"));
  if (!list.length) return [];
  const out: CloudinaryUploadResult[] = [];
  const n = list.length;
  for (let i = 0; i < n; i++) {
    const file = list[i]!;
    const res = await uploadToCloudinary(file, purpose, (pct) => {
      const base = (i / n) * 100;
      const slice = (1 / n) * 100;
      onOverallProgress?.(Math.min(100, Math.round(base + (pct / 100) * slice)));
    });
    out.push(res);
  }
  onOverallProgress?.(100);
  return out;
}

/** Returns only the HTTPS URL (backward compatible). */
export async function uploadImageToCloudinary(
  file: File,
  purpose: CloudinarySignPurpose = "articles",
  onProgress?: CloudinaryUploadProgress
): Promise<string> {
  const { secureUrl } = await uploadToCloudinary(file, purpose, onProgress);
  return secureUrl;
}

/** Returns Cloudinary `secure_url` and `public_id` (needed for gallery DB records). */
export async function uploadImageToCloudinaryWithIds(
  file: File,
  purpose: CloudinarySignPurpose = "articles",
  onProgress?: CloudinaryUploadProgress
): Promise<CloudinaryUploadResult> {
  return uploadToCloudinary(file, purpose, onProgress);
}
