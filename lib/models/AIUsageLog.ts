import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAIUsageLog extends Document {
  userId?: mongoose.Types.ObjectId;
  questionHash: string;
  aiModel: string;
  tokensUsed?: number;
  responseTimeMs: number;
  fromCache: boolean;
  timestamp: Date;
}

const aiUsageLogSchema = new Schema<IAIUsageLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    questionHash: { type: String, required: true },
    aiModel: { type: String, required: true },
    tokensUsed: { type: Number },
    responseTimeMs: { type: Number, default: 0 },
    fromCache: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

aiUsageLogSchema.index({ userId: 1, timestamp: -1 });
aiUsageLogSchema.index({ timestamp: -1 });

const AIUsageLog: Model<IAIUsageLog> = mongoose.models.AIUsageLog || mongoose.model<IAIUsageLog>("AIUsageLog", aiUsageLogSchema);
export default AIUsageLog;
