import mongoose, { Document, Model, Schema } from "mongoose";

export interface IContact extends Document {
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "unread" | "read" | "replied";
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

const contactSchema = new Schema<IContact>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 2000 },
    status: { type: String, enum: ["unread", "read", "replied"], default: "unread" },
    ip: { type: String },
  },
  { timestamps: true }
);

contactSchema.index({ status: 1, createdAt: -1 });

const Contact: Model<IContact> = mongoose.models.Contact || mongoose.model<IContact>("Contact", contactSchema);
export default Contact;
