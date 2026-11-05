import mongoose, { Schema, model } from "mongoose";

export interface IPaymentTransaction {
  order: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  provider: "razorpay" | "cod";
  amount: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "failed" | "partially_refunded" | "refunded";
  gatewayOrderId?: string | null;
  gatewayPaymentId?: string | null;
  gatewaySignature?: string | null;
  refunds: Array<{
    gatewayRefundId: string;
    amount: number;
    status: "pending" | "processed" | "failed";
  }>;
  refundedAmount: number;
  failureReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const paymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    provider: { type: String, enum: ["razorpay", "cod"], required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "INR" },
    status: {
      type: String,
      enum: ["created", "authorized", "captured", "failed", "partially_refunded", "refunded"],
      default: "created",
    },
    gatewayOrderId: { type: String, default: null, index: true },
    gatewayPaymentId: { type: String, default: null },
    gatewaySignature: { type: String, default: null, select: false },
    refunds: {
      type: [
        {
          gatewayRefundId: { type: String, required: true },
          amount: { type: Number, required: true, min: 0 },
          status: { type: String, enum: ["pending", "processed", "failed"], default: "pending" },
        },
      ],
      default: [],
    },
    refundedAmount: { type: Number, default: 0, min: 0 },
    failureReason: { type: String, default: null },
  },
  { timestamps: true }
);

export default model<IPaymentTransaction>("PaymentTransaction", paymentTransactionSchema);
