import mongoose, { Document, Model, Schema } from "mongoose";

export interface INotice extends Document {
  title: string;
  body: string;
  linkUrl?: string;
  linkLabel?: string;
  isActive: boolean;
  sortOrder: number;
  authorId: mongoose.Types.ObjectId;
  expiresAt?: Date | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const noticeSchema = new Schema<INotice>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, maxlength: 3000 },
    linkUrl: { type: String, maxlength: 500 },
    linkLabel: { type: String, maxlength: 80 },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

noticeSchema.index({ isActive: 1, sortOrder: -1, createdAt: -1 });

const Notice: Model<INotice> = mongoose.models.Notice || mongoose.model<INotice>("Notice", noticeSchema);
export default Notice;
