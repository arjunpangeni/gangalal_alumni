import { z } from "zod";

export const committeeMemberCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  post: z.string().min(1, "Post is required").max(120),
  photo: z.string().url("Enter a valid photo URL").max(500).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(9999).optional(),
});

export const committeeMemberPatchSchema = committeeMemberCreateSchema.partial();

export type CommitteeMemberCreateInput = z.infer<typeof committeeMemberCreateSchema>;
export type CommitteeMemberPatchInput = z.infer<typeof committeeMemberPatchSchema>;
