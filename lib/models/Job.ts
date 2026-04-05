import mongoose, { Document, Model, Schema } from "mongoose";

export interface IJob extends Document {
  title: string;
  slug: string;
  description: string;
  company: string;
  location: string;
  type: "full-time" | "part-time" | "contract" | "internship";
  salary?: string;
  educationOrSkills?: string;
  /** Optional external apply link */
  applyUrl?: string;
  /** Contact for applications (shown when no URL) */
  applyEmail?: string;
  applyPhone?: string;
  expiresAt?: Date;
  tags: string[];
  authorId: mongoose.Types.ObjectId;
  status: "draft" | "pending" | "published" | "archived";
  acl: "public" | "member";
  embedding?: number[];
  contentHash?: string;
  rejectionReason?: string;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const jobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, maxlength: 5000 },
    company: { type: String, required: true, maxlength: 100 },
    location: { type: String, required: true, maxlength: 100 },
    type: { type: String, enum: ["full-time", "part-time", "contract", "internship"], default: "full-time" },
    salary: { type: String, maxlength: 100 },
    educationOrSkills: { type: String, maxlength: 2000 },
    applyUrl: { type: String, maxlength: 500 },
    applyEmail: { type: String, maxlength: 200, lowercase: true, trim: true },
    applyPhone: { type: String, maxlength: 40, trim: true },
    expiresAt: { type: Date },
    tags: [{ type: String, maxlength: 50 }],
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["draft", "pending", "published", "archived"], default: "draft" },
    acl: { type: String, enum: ["public", "member"], default: "public" },
    embedding: [{ type: Number }],
    contentHash: { type: String },
    rejectionReason: { type: String },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

jobSchema.index({ authorId: 1 });
jobSchema.index({ status: 1, createdAt: -1 });

/** Next.js dev can keep a stale compiled model; drop so schema changes (e.g. applyUrl) take effect. */
if (process.env.NODE_ENV === "development" && mongoose.models.Job) {
  mongoose.deleteModel("Job");
}

const Job: Model<IJob> = mongoose.models.Job ?? mongoose.model<IJob>("Job", jobSchema);
export default Job;
