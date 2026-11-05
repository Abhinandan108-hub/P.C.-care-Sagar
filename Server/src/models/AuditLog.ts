import mongoose, { Schema, model } from "mongoose";

export interface IAuditLog {
  actor?: mongoose.Types.ObjectId | null;
  action: string;
  method: string;
  path: string;
  statusCode: number;
  requestId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    action: { type: String, required: true, maxlength: 200 },
    method: { type: String, required: true },
    path: { type: String, required: true, maxlength: 500 },
    statusCode: { type: Number, required: true },
    requestId: { type: String, required: true, index: true },
    ipAddress: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

export default model<IAuditLog>("AuditLog", auditLogSchema);
