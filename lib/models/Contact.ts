import mongoose, { Document, Model, Schema } from "mongoose";

export type ContactStatus = "pending" | "resolved";

export interface IContact extends Document {
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactStatus;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Map legacy DB values and normalize API responses. */
export function normalizeContactStatus(raw: string | undefined): ContactStatus {
  if (raw === "resolved" || raw === "replied") return "resolved";
  return "pending";
}

/** Raw DB values treated as “pending” in admin filters (includes legacy enums). */
export const CONTACT_PENDING_STATUS_VALUES = ["pending", "unread", "read"] as const;
/** Raw DB values treated as “resolved” in admin filters. */
export const CONTACT_RESOLVED_STATUS_VALUES = ["resolved", "replied"] as const;

const contactSchema = new Schema<IContact>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 2000 },
    status: { type: String, enum: ["pending", "resolved"], default: "pending" },
    ip: { type: String },
  },
  { timestamps: true }
);

contactSchema.index({ status: 1, createdAt: -1 });

const Contact: Model<IContact> = mongoose.models.Contact || mongoose.model<IContact>("Contact", contactSchema);
export default Contact;
