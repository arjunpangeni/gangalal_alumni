import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  email: string;
  name: string;
  image?: string;
  role: "user" | "admin" | "superadmin";
  status: "pending" | "approved" | "rejected" | "banned";
  sessionVersion: number;
  profile: {
    bio?: string;
    slcSeeBatch?: number;
    schoolPeriod?: string;
    profession?: string;
    company?: string;
    permanentAddress?: string;
    city?: string;
    country?: string;
    linkedin?: string;
    facebook?: string;
    phone?: string;
  };
  profileUpdateRequest?: {
    data: object;
    status: "pending" | "approved" | "rejected";
    requestedAt: Date;
  };
  availableForMentorship: boolean;
  mentorshipBio?: string;
  mentorshipSkills: string[];
  bannedReason?: string;
  embedding?: number[];
  contentHash?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    image: { type: String },
    role: { type: String, enum: ["user", "admin", "superadmin"], default: "user" },
    status: { type: String, enum: ["pending", "approved", "rejected", "banned"], default: "pending" },
    sessionVersion: { type: Number, default: 0 },
    profile: {
      bio: { type: String, maxlength: 500 },
      slcSeeBatch: { type: Number },
      schoolPeriod: { type: String, maxlength: 50 },
      profession: { type: String, maxlength: 100 },
      company: { type: String, maxlength: 100 },
      permanentAddress: { type: String, maxlength: 200 },
      city: { type: String, maxlength: 100 },
      country: { type: String, maxlength: 100 },
      linkedin: { type: String, maxlength: 200 },
      facebook: { type: String, maxlength: 200 },
      phone: { type: String, maxlength: 20 },
    },
    profileUpdateRequest: {
      data: { type: Schema.Types.Mixed },
      status: { type: String, enum: ["pending", "approved", "rejected"] },
      requestedAt: { type: Date },
    },
    availableForMentorship: { type: Boolean, default: false },
    mentorshipBio: { type: String, maxlength: 500 },
    mentorshipSkills: [{ type: String, maxlength: 50 }],
    bannedReason: { type: String },
    embedding: [{ type: Number }],
    contentHash: { type: String },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ status: 1, createdAt: -1 });
userSchema.index({ role: 1 });
userSchema.index({ availableForMentorship: 1 });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", userSchema);
export default User;
