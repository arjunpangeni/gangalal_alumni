import mongoose, { Document, Model, Schema } from "mongoose";

export interface IPhoto {
  url: string;
  caption?: string;
  publicId: string;
}

export interface IAlbum extends Document {
  title: string;
  slug: string;
  description?: string;
  coverImage?: string;
  photos: IPhoto[];
  authorId: mongoose.Types.ObjectId;
  status: "draft" | "published" | "archived";
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const photoSchema = new Schema<IPhoto>(
  {
    url: { type: String, required: true },
    caption: { type: String, maxlength: 200 },
    publicId: { type: String, required: true },
  },
  { _id: true }
);

const albumSchema = new Schema<IAlbum>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, maxlength: 1000 },
    coverImage: { type: String },
    photos: [photoSchema],
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["draft", "published", "archived"], default: "published" },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

albumSchema.index({ status: 1, createdAt: -1 });

const Album: Model<IAlbum> = mongoose.models.Album || mongoose.model<IAlbum>("Album", albumSchema);
export default Album;
