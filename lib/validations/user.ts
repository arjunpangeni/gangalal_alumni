import { z } from "zod";
import NepaliDate from "nepali-date-converter";

const currentBsYear = Number.parseInt(NepaliDate.fromAD(new Date()).format("YYYY", "en"), 10) || 2100;

/** Admin-only: same fields as member profile plus optional avatar URL (paste Cloudinary or HTTPS link). */
export const adminUserProfilePutSchema = z.object({
  name: z.string().min(2, "Display name must be at least 2 characters").max(100),
  image: z.string().url("Enter a valid image URL").max(500).optional().or(z.literal("")),
  bio: z.string().min(10, "Bio must be at least 10 characters").max(500),
  slcSeeBatch: z.number().int().min(1950).max(currentBsYear).optional(),
  schoolPeriod: z.string().max(50).optional(),
  profession: z.string().min(2, "Profession is required").max(100),
  company: z.string().max(100).optional(),
  permanentAddress: z.string().min(3, "Permanent address is required").max(200),
  city: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  linkedin: z.string().url("Enter a valid URL").max(200).optional().or(z.literal("")),
  facebook: z.string().url("Enter a valid URL").max(200).optional().or(z.literal("")),
  phone: z.string().min(7, "Phone number is required").max(20),
});

export const profileUpdateSchema = adminUserProfilePutSchema.omit({ image: true });

export const adminUserActionSchema = z.object({
  action: z.enum([
    "approve",
    "reject",
    "ban",
    "unban",
    "change-role",
    "approve-profile-update",
    "reject-profile-update",
    "remove-user",
  ]),
  reason: z.string().min(10).max(500).optional(),
  role: z.enum(["user", "admin", "superadmin"]).optional(),
});

export const mentorshipUpdateSchema = z.object({
  availableForMentorship: z.boolean(),
  mentorshipBio: z.string().max(500).optional(),
  mentorshipSkills: z.array(z.string().max(50)).max(15).optional(),
});

export const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(200),
  subject: z.string().min(3).max(200),
  message: z.string().min(20).max(2000),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type AdminUserProfilePutInput = z.infer<typeof adminUserProfilePutSchema>;
export type AdminUserActionInput = z.infer<typeof adminUserActionSchema>;
export type MentorshipUpdateInput = z.infer<typeof mentorshipUpdateSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
