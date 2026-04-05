import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAuditLog extends Document {
  adminId: mongoose.Types.ObjectId;
  action: string;
  targetUserId?: mongoose.Types.ObjectId;
  targetContentId?: mongoose.Types.ObjectId;
  targetContentType?: string;
  reason?: string;
  ip?: string;
  metadata?: object;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    targetUserId: { type: Schema.Types.ObjectId, ref: "User" },
    targetContentId: { type: Schema.Types.ObjectId },
    targetContentType: { type: String },
    reason: { type: String },
    ip: { type: String },
    metadata: { type: Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

auditLogSchema.index({ adminId: 1, timestamp: -1 });
auditLogSchema.index({ targetUserId: 1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

const AuditLog: Model<IAuditLog> = mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", auditLogSchema);
export default AuditLog;
