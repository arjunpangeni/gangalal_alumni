import mongoose, { Document, Model, Schema } from "mongoose";

export interface IArticle extends Document {
  title: string;
  slug: string;
  content: object;
  excerpt: string;
  coverImage?: string;
  tags: string[];
  readTime: number;
  authorId: mongoose.Types.ObjectId;
  status: "draft" | "pending" | "published" | "archived";
  acl: "public" | "member";
  embedding?: number[];
  contentHash?: string;
  deletedAt?: Date | null;
  deleteRequestedAt?: Date | null;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const articleSchema = new Schema<IArticle>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    content: { type: Schema.Types.Mixed, required: true },
    excerpt: { type: String, maxlength: 300 },
    coverImage: { type: String },
    tags: [{ type: String, maxlength: 50 }],
    readTime: { type: Number, default: 1 },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["draft", "pending", "published", "archived"], default: "draft" },
    acl: { type: String, enum: ["public", "member"], default: "public" },
    embedding: [{ type: Number }],
    contentHash: { type: String },
    deletedAt: { type: Date, default: null },
    deleteRequestedAt: { type: Date, default: null },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

articleSchema.index({ authorId: 1 });
articleSchema.index({ status: 1, createdAt: -1 });
articleSchema.index({ tags: 1 });
articleSchema.index({ title: "text", excerpt: "text" });

const Article: Model<IArticle> = mongoose.models.Article || mongoose.model<IArticle>("Article", articleSchema);
export default Article;
