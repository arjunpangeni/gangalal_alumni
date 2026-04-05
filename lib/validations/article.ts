import { z } from "zod";

export const createArticleSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.record(z.string(), z.unknown()),
  excerpt: z.string().max(300).optional(),
  coverImage: z.string().url().max(500).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  acl: z.enum(["public", "member"]).default("public"),
  /** Members: draft = save privately; pending = submit for admin review. Ignored for admins (they publish). */
  submitAction: z.enum(["draft", "pending"]).default("draft"),
});

export const updateArticleSchema = createArticleSchema.partial().extend({
  status: z.enum(["draft", "pending", "published", "archived"]).optional(),
});

export const articleActionSchema = z.object({
  action: z.enum(["approve", "reject", "request-delete"]),
  reason: z.string().min(10).max(500).optional(),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
