import mongoose, { Document, Model, Schema } from "mongoose";

export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  coverImage?: string;
  startDate: Date;
  endDate: Date;
  venue: string;
  capacity?: number;
  rsvpUrl?: string;
  tags: string[];
  authorId: mongoose.Types.ObjectId;
  status: "draft" | "published" | "archived";
  acl: "public" | "member";
  embedding?: number[];
  contentHash?: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, maxlength: 5000 },
    coverImage: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    venue: { type: String, required: true, maxlength: 200 },
    capacity: { type: Number },
    rsvpUrl: { type: String },
    tags: [{ type: String, maxlength: 50 }],
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    acl: { type: String, enum: ["public", "member"], default: "public" },
    embedding: [{ type: Number }],
    contentHash: { type: String },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

eventSchema.index({ authorId: 1 });
eventSchema.index({ status: 1, startDate: -1 });

const Event: Model<IEvent> = mongoose.models.Event || mongoose.model<IEvent>("Event", eventSchema);
export default Event;
