import { z } from "zod";

const expiresAtCreate = z
  .union([z.string(), z.literal(""), z.null()])
  .optional()
  .transform((val) => {
    if (val === null || val === undefined || val === "") return undefined;
    const d = new Date(String(val));
    return Number.isNaN(d.getTime()) ? undefined : d;
  });

export const createNoticeSchema = z.object({
  title: z.string().min(2).max(200),
  body: z.string().min(3).max(3000),
  linkUrl: z.string().max(500).optional(),
  linkLabel: z.string().max(80).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  expiresAt: expiresAtCreate,
});

/** Partial update; `expiresAt: null` or `""` clears the expiry on the notice. */
const expiresAtUpdate = z
  .union([z.string(), z.literal(""), z.null()])
  .optional()
  .transform((val) => {
    if (val === undefined) return undefined;
    if (val === null || val === "") return null;
    const d = new Date(String(val));
    return Number.isNaN(d.getTime()) ? undefined : d;
  });

export const updateNoticeSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  body: z.string().min(3).max(3000).optional(),
  linkUrl: z.string().max(500).optional(),
  linkLabel: z.string().max(80).optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  expiresAt: expiresAtUpdate,
});

export type CreateNoticeInput = z.infer<typeof createNoticeSchema>;
export type UpdateNoticeInput = z.infer<typeof updateNoticeSchema>;
