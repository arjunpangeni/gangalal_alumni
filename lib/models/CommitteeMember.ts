import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICommitteeMember extends Document {
  name: string;
  post: string;
  photo?: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const committeeMemberSchema = new Schema<ICommitteeMember>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    post: { type: String, required: true, trim: true, maxlength: 120 },
    photo: { type: String, maxlength: 500 },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

committeeMemberSchema.index({ sortOrder: -1, createdAt: -1 });

const CommitteeMember: Model<ICommitteeMember> =
  mongoose.models.CommitteeMember || mongoose.model<ICommitteeMember>("CommitteeMember", committeeMemberSchema);

export default CommitteeMember;
