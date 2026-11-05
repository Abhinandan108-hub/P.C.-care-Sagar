import { Schema, model } from "mongoose";

export interface ICoupon {
  code: string;
  type: "percentage" | "fixed";
  amount: number;
  minimumSubtotal: number;
  maximumDiscount?: number | null;
  maxUses?: number | null;
  usedCount: number;
  startsAt?: Date | null;
  expiresAt?: Date | null;
  isActive: boolean;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ["percentage", "fixed"], required: true },
    amount: { type: Number, required: true, min: 0 },
    minimumSubtotal: { type: Number, default: 0, min: 0 },
    maximumDiscount: { type: Number, default: null, min: 0 },
    maxUses: { type: Number, default: null, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
    startsAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default model<ICoupon>("Coupon", couponSchema);
