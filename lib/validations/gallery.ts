import { z } from "zod";

export const createAlbumSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  coverImage: z.string().url().optional(),
});

/** Accepts `url` (stored in DB) or `secureUrl` (Cloudinary client helper output). */
const galleryPhotoInputSchema = z
  .object({
    url: z.string().url().optional(),
    secureUrl: z.string().url().optional(),
    publicId: z.string().min(1),
    caption: z.string().max(200).optional(),
  })
  .refine((p) => Boolean(p.url ?? p.secureUrl), { message: "Each photo needs url or secureUrl" })
  .transform((p) => ({
    url: (p.url ?? p.secureUrl) as string,
    publicId: p.publicId,
    caption: p.caption,
  }));

export const addPhotosSchema = z.object({
  photos: z.array(galleryPhotoInputSchema).min(1).max(50),
});

export const deleteGalleryPhotoSchema = z.object({
  publicId: z.string().min(1),
});

export type CreateAlbumInput = z.infer<typeof createAlbumSchema>;
export type AddPhotosInput = z.infer<typeof addPhotosSchema>;
export type DeleteGalleryPhotoInput = z.infer<typeof deleteGalleryPhotoSchema>;
