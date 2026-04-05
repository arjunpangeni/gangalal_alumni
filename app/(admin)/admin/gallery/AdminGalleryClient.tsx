"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, ImagePlus, Trash2 } from "lucide-react";
import { uploadImagesToCloudinaryWithIds } from "@/lib/cloudinary-upload-client";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { UploadProgressBar } from "@/components/ui/UploadProgressBar";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export interface AdminAlbumRow {
  _id: string;
  title: string;
  slug: string;
  photoCount: number;
  status: string;
  photos: { url: string; publicId: string }[];
}

export function AdminGalleryClient({ initialAlbums }: { initialAlbums: AdminAlbumRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [createProgress, setCreateProgress] = useState<number | null>(null);
  const [albumProgress, setAlbumProgress] = useState<number | null>(null);
  const [deletingAlbumId, setDeletingAlbumId] = useState<string | null>(null);
  const [deletingPhotoKey, setDeletingPhotoKey] = useState<string | null>(null);
  const [albumDeleteTarget, setAlbumDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [photoDeleteTarget, setPhotoDeleteTarget] = useState<{ albumId: string; publicId: string } | null>(null);
  const newAlbumFilesRef = useRef<HTMLInputElement>(null);

  function toGalleryPhotoPayload(results: { secureUrl: string; publicId: string }[]) {
    return results.map((p) => ({ url: p.secureUrl, publicId: p.publicId }));
  }

  async function createAlbumAndUpload(e: React.FormEvent) {
    e.preventDefault();
    const files = newAlbumFilesRef.current?.files;
    if (!files?.length) {
      toast.error("Choose at least one photo to create the album in one step.");
      return;
    }
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!imageFiles.length) {
      toast.error("Only image files are allowed.");
      return;
    }

    setBusy(true);
    setCreateProgress(0);
    try {
      const createRes = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
        }),
      });
      const createJson = (await createRes.json()) as {
        success?: boolean;
        data?: { id?: string; slug?: string };
        error?: string;
      };
      if (!createJson.success || !createJson.data?.id) {
        toast.error(createJson.error ?? "Could not create album.");
        return;
      }

      const albumId = String(createJson.data.id);
      setCreateProgress(15);

      const photos = await uploadImagesToCloudinaryWithIds(imageFiles, "gallery", (pct) => {
        setCreateProgress(15 + Math.round((pct / 100) * 80));
      });

      setCreateProgress(95);
      const photosRes = await fetch(`/api/gallery/${albumId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: toGalleryPhotoPayload(photos) }),
      });
      const photosJson = await photosRes.json();
      if (!photosJson.success) {
        toast.error(photosJson.error ?? "Album created but saving photos failed. Add them from the list below.");
      } else {
        toast.success(`Album created with ${photos.length} photo(s).`);
        setTitle("");
        setDescription("");
        if (newAlbumFilesRef.current) newAlbumFilesRef.current.value = "";
      }
      setCreateProgress(100);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
      setTimeout(() => setCreateProgress(null), 600);
    }
  }

  async function uploadPhotos(albumId: string, files: FileList | null) {
    if (!files?.length) return;
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!imageFiles.length) {
      toast.error("No images selected.");
      return;
    }

    setUploadingId(albumId);
    setAlbumProgress(0);
    try {
      const photos = await uploadImagesToCloudinaryWithIds(imageFiles, "gallery", (pct) => {
        setAlbumProgress(pct);
      });

      setAlbumProgress(98);
      const res = await fetch(`/api/gallery/${albumId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photos: toGalleryPhotoPayload(photos) }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Added ${photos.length} photo(s).`);
        router.refresh();
      } else {
        toast.error(json.error ?? "Failed.");
      }
      setAlbumProgress(100);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploadingId(null);
      setTimeout(() => setAlbumProgress(null), 400);
    }
  }

  return (
    <div className="space-y-10 max-w-3xl">
      <form onSubmit={(e) => void createAlbumAndUpload(e)} className="rounded-xl border p-4 sm:p-6 space-y-4 bg-card">
        <h2 className="font-semibold text-lg">New album &amp; photos</h2>
        <p className="text-sm text-muted-foreground">
          Enter details, select one or more images, then submit once. The album is created and all photos are uploaded together.
        </p>
        <div className="space-y-2">
          <Label htmlFor="album-title">Title</Label>
          <Input id="album-title" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={2} disabled={busy} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="album-desc">Description (optional)</Label>
          <Textarea id="album-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} disabled={busy} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="album-photos">Photos (required)</Label>
          <Input
            ref={newAlbumFilesRef}
            id="album-photos"
            type="file"
            accept="image/*"
            multiple
            disabled={busy}
            className="cursor-pointer"
          />
        </div>
        {busy && createProgress !== null ? (
          <UploadProgressBar value={createProgress} label="Creating album and uploading to Cloudinary…" />
        ) : null}
        <Button type="submit" disabled={busy} className="gradient-primary text-white border-0">
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Create album &amp; upload photos
        </Button>
      </form>

      <div>
        <h2 className="font-semibold text-lg mb-3">Albums</h2>
        <p className="text-sm text-muted-foreground mb-4">Add more photos to an existing album anytime.</p>
        <ul className="space-y-4">
          {initialAlbums.length === 0 ? (
            <p className="text-muted-foreground text-sm">No albums yet. Create one with the form above.</p>
          ) : (
            initialAlbums.map((a) => (
              <li key={a._id} className="rounded-lg border p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.photoCount} photo(s) · {a.status} · slug: {a.slug}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <label
                      className={cn(
                        buttonVariants({ variant: "outline", size: "sm" }),
                        "cursor-pointer gap-2 inline-flex items-center justify-center min-h-9",
                        uploadingId === a._id && "pointer-events-none opacity-50"
                      )}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="sr-only"
                        disabled={uploadingId === a._id}
                        onChange={(e) => {
                          void uploadPhotos(a._id, e.target.files);
                          e.target.value = "";
                        }}
                      />
                      {uploadingId === a._id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <ImagePlus className="size-4" />
                      )}
                      Upload more photos
                    </label>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="gap-1.5"
                      disabled={deletingAlbumId === a._id || uploadingId === a._id}
                      onClick={() => setAlbumDeleteTarget({ id: a._id, title: a.title })}
                    >
                      {deletingAlbumId === a._id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                      Delete album
                    </Button>
                  </div>
                </div>
                {a.photos.length > 0 ? (
                  <div className="max-h-56 overflow-y-auto rounded-md border bg-muted/20 p-2">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {a.photos.map((ph) => {
                        const pk = `${a._id}:${ph.publicId}`;
                        const busyPhoto = deletingPhotoKey === pk;
                        return (
                          <div key={ph.publicId} className="relative aspect-square overflow-hidden rounded-md border bg-background">
                            <img src={ph.url} alt="" className="size-full object-cover" />
                            <button
                              type="button"
                              title="Delete photo"
                              disabled={busyPhoto || uploadingId === a._id}
                              className="absolute right-1 top-1 flex size-8 items-center justify-center rounded-md bg-destructive/90 text-destructive-foreground shadow-sm hover:bg-destructive disabled:opacity-50"
                              onClick={() => setPhotoDeleteTarget({ albumId: a._id, publicId: ph.publicId })}
                            >
                              {busyPhoto ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                {uploadingId === a._id && albumProgress !== null ? (
                  <UploadProgressBar value={albumProgress} label="Uploading…" />
                ) : null}
              </li>
            ))
          )}
        </ul>
      </div>

      <ConfirmDialog
        open={albumDeleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setAlbumDeleteTarget(null);
        }}
        title="Delete this album?"
        description={
          albumDeleteTarget ? (
            <>
              Delete <strong className="text-foreground">“{albumDeleteTarget.title}”</strong> and all its photos? This
              cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete album"
        cancelLabel="Cancel"
        variant="destructive"
        pending={albumDeleteTarget !== null && deletingAlbumId === albumDeleteTarget.id}
        onConfirm={async () => {
          if (!albumDeleteTarget) return;
          const albumId = albumDeleteTarget.id;
          setDeletingAlbumId(albumId);
          try {
            const res = await fetch(`/api/gallery/${albumId}`, { method: "DELETE" });
            const json = (await res.json()) as { success?: boolean; error?: string };
            if (!json.success) {
              toast.error(json.error ?? "Could not delete album.");
              throw new Error("api");
            }
            toast.success("Album deleted.");
            router.refresh();
          } catch (e) {
            if (e instanceof Error && e.message === "api") throw e;
            toast.error("Delete failed.");
            throw e;
          } finally {
            setDeletingAlbumId(null);
          }
        }}
      />

      <ConfirmDialog
        open={photoDeleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setPhotoDeleteTarget(null);
        }}
        title="Remove this photo?"
        description="It will be removed from the album and deleted from storage."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        variant="destructive"
        pending={
          photoDeleteTarget !== null &&
          deletingPhotoKey === `${photoDeleteTarget.albumId}:${photoDeleteTarget.publicId}`
        }
        onConfirm={async () => {
          if (!photoDeleteTarget) return;
          const { albumId, publicId } = photoDeleteTarget;
          const key = `${albumId}:${publicId}`;
          setDeletingPhotoKey(key);
          try {
            const res = await fetch(`/api/gallery/${albumId}/photos`, {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ publicId }),
            });
            const json = (await res.json()) as { success?: boolean; error?: string };
            if (!json.success) {
              toast.error(json.error ?? "Could not delete photo.");
              throw new Error("api");
            }
            toast.success("Photo removed.");
            router.refresh();
          } catch (e) {
            if (e instanceof Error && e.message === "api") throw e;
            toast.error("Delete failed.");
            throw e;
          } finally {
            setDeletingPhotoKey(null);
          }
        }}
      />
    </div>
  );
}
