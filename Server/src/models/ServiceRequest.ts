import mongoose, { Schema, model } from "mongoose";

export type ServiceStatus =
  | "requested"
  | "assigned"
  | "diagnosing"
  | "awaiting_approval"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface IServiceNote {
  author: mongoose.Types.ObjectId;
  authorName: string;
  authorRole: string;
  message: string;
  internal: boolean;
  createdAt: Date;
}

export interface IServiceImage {
  url: string;
  publicId: string;
  uploadedAt: Date;
}

export interface IServiceRequest {
  ticketNumber: string;
  customer: mongoose.Types.ObjectId;
  technician?: mongoose.Types.ObjectId | null;
  deviceType: string;
  brand?: string | null;
  model?: string | null;
  serialNumber?: string | null;
  problemDescription: string;
  images: IServiceImage[];
  status: ServiceStatus;
  estimatedCost?: number | null;
  finalCost?: number | null;
  currency: string;
  billingStatus: "unpaid" | "paid" | "refunded";
  notes: IServiceNote[];
  history: Array<{
    status: ServiceStatus;
    message: string;
    changedBy: mongoose.Types.ObjectId;
    changedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const serviceNoteSchema = new Schema<IServiceNote>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    authorName: { type: String, required: true },
    authorRole: { type: String, required: true },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    internal: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const serviceRequestSchema = new Schema<IServiceRequest>(
  {
    ticketNumber: { type: String, required: true, unique: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    technician: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    deviceType: { type: String, required: true, trim: true },
    brand: { type: String, default: null, trim: true },
    model: { type: String, default: null, trim: true },
    serialNumber: { type: String, default: null, trim: true },
    problemDescription: { type: String, required: true, trim: true, maxlength: 3000 },
    images: {
      type: [
        {
          url: { type: String, required: true },
          publicId: { type: String, required: true },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    status: {
      type: String,
      enum: [
        "requested",
        "assigned",
        "diagnosing",
        "awaiting_approval",
        "in_progress",
        "completed",
        "cancelled",
      ],
      default: "requested",
    },
    estimatedCost: { type: Number, default: null, min: 0 },
    finalCost: { type: Number, default: null, min: 0 },
    currency: { type: String, default: "INR" },
    billingStatus: { type: String, enum: ["unpaid", "paid", "refunded"], default: "unpaid" },
    notes: { type: [serviceNoteSchema], default: [] },
    history: {
      type: [
        {
          status: {
            type: String,
            enum: [
              "requested",
              "assigned",
              "diagnosing",
              "awaiting_approval",
              "in_progress",
              "completed",
              "cancelled",
            ],
            required: true,
          },
          message: { type: String, required: true },
          changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
          changedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

serviceRequestSchema.index({ status: 1, createdAt: -1 });
serviceRequestSchema.index({ billingStatus: 1, createdAt: -1 });

export default model<IServiceRequest>("ServiceRequest", serviceRequestSchema);
