import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  coverImage: z.string().url().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  venue: z.string().min(2).max(200),
  capacity: z.number().int().positive().optional(),
  rsvpUrl: z.string().url().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  acl: z.enum(["public", "member"]).default("public"),
});

export const updateEventSchema = createEventSchema.partial().extend({
  status: z.enum(["draft", "published", "archived"]).optional(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
