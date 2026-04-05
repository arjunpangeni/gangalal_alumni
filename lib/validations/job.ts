import { z } from "zod";

function refineApplyUrl(data: { applyUrl?: string }, ctx: z.RefinementCtx) {
  const u = (data.applyUrl ?? "").trim();
  if (u && !/^https?:\/\/.+/i.test(u) && !/^mailto:.+/i.test(u)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Apply link must be a valid http(s) URL or mailto: address (or leave empty)",
      path: ["applyUrl"],
    });
  }
}

/** At least one way to apply: email, phone, or optional external URL. */
function refineApplyContact(
  data: { applyUrl?: string; applyEmail?: string; applyPhone?: string },
  ctx: z.RefinementCtx
) {
  const url = (data.applyUrl ?? "").trim();
  const email = (data.applyEmail ?? "").trim();
  const phone = (data.applyPhone ?? "").trim();
  if (!url && !email && !phone) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Add an application email or phone number (or an optional apply link).",
      path: ["applyEmail"],
    });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Enter a valid email address.",
      path: ["applyEmail"],
    });
  }
}

/** Empty or missing salary becomes "Negotiable" for listings. */
const salarySchema = z
  .string()
  .max(100)
  .optional()
  .transform((s) => {
    const t = (s ?? "").trim();
    return t.length > 0 ? t : "Negotiable";
  });

/** HTML date input or ISO string → Date; required for new posts and full updates. */
const expiresAtSchema = z.preprocess(
  (val) => {
    if (val instanceof Date) return val.toISOString().slice(0, 10);
    return val;
  },
  z
    .string()
    .min(1, "Application deadline is required")
    .transform((s) => new Date(s))
    .refine((d) => !Number.isNaN(d.getTime()), { message: "Enter a valid deadline" })
);

const jobBodySchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(20).max(5000),
  company: z.string().min(1).max(100),
  location: z.string().min(1).max(100),
  type: z.enum(["full-time", "part-time", "contract", "internship"]).default("full-time"),
  salary: salarySchema,
  educationOrSkills: z.string().max(2000).optional(),
  applyUrl: z
    .string()
    .max(500)
    .optional()
    .transform((s) => s?.trim() ?? ""),
  applyEmail: z
    .string()
    .max(200)
    .optional()
    .transform((s) => (s ?? "").trim().toLowerCase()),
  applyPhone: z
    .string()
    .max(40)
    .optional()
    .transform((s) => (s ?? "").trim()),
  expiresAt: expiresAtSchema,
  tags: z.array(z.string().max(50)).max(10).optional(),
  acl: z.enum(["public", "member"]).default("public"),
});

/** Client form + valid create body (without submitAction). */
export const jobFormSchema = jobBodySchema
  .superRefine(refineApplyUrl)
  .superRefine(refineApplyContact);

export const createJobSchema = jobBodySchema
  .extend({
    submitAction: z.enum(["draft", "pending"]).default("draft"),
  })
  .superRefine(refineApplyUrl)
  .superRefine(refineApplyContact);

/** Full body required (dashboard editor always sends all fields). */
export const updateJobSchema = jobBodySchema
  .extend({
    status: z.enum(["draft", "pending", "published", "archived"]).optional(),
  })
  .superRefine(refineApplyUrl)
  .superRefine(refineApplyContact);

export const jobActionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().min(10).max(500).optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type JobFormInput = z.input<typeof jobFormSchema>;
