import mongoose, { Schema, model } from "mongoose";

export type OrderStatus =
  | "pending_payment"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  sku?: string | null;
  image_url?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface IOrder {
  orderNumber: string;
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  paymentMethod: "cod" | "razorpay";
  paymentStatus: "pending" | "paid" | "failed" | "partially_refunded" | "refunded";
  status: OrderStatus;
  subtotal: number;
  shippingCharge: number;
  discount: number;
  total: number;
  couponCode?: string | null;
  trackingNumber?: string | null;
  notes?: string | null;
  stockReserved: boolean;
  reservationExpiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, default: null },
    image_url: { type: String, default: null },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, default: null, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    shippingAddress: { type: shippingAddressSchema, required: true },
    paymentMethod: { type: String, enum: ["cod", "razorpay"], required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "partially_refunded", "refunded"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["pending_payment", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      required: true,
    },
    subtotal: { type: Number, required: true, min: 0 },
    shippingCharge: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    couponCode: { type: String, default: null, uppercase: true, trim: true },
    trackingNumber: { type: String, default: null, trim: true },
    notes: { type: String, default: null, trim: true },
    stockReserved: { type: Boolean, default: true },
    reservationExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

orderSchema.index({ paymentStatus: 1, createdAt: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

export default model<IOrder>("Order", orderSchema);
