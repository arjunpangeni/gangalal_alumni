/**
 * XMLHttpRequest POST with upload progress (bytes sent to your API).
 * Use for multipart routes like /api/profile/photo.
 */

export async function postFormDataWithUploadProgress(
  url: string,
  formData: FormData,
  onProgress?: (percent: number, lengthComputable: boolean) => void
): Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        onProgress?.(Math.round((e.loaded / e.total) * 100), true);
      } else {
        onProgress?.(0, false);
      }
    };
    xhr.onload = () => {
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        json: async () => {
          try {
            return JSON.parse(xhr.responseText || "{}") as unknown;
          } catch {
            return {};
          }
        },
      });
    };
    xhr.onerror = () => reject(new Error("Network error while uploading."));
    xhr.send(formData);
  });
}
