import mongoose, { Schema, model } from "mongoose";
import { IShippingAddress } from "./Order";

export interface IBulkEnquiry {
  referenceNumber: string;
  customer: mongoose.Types.ObjectId;
  contactName: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  shippingAddress: IShippingAddress;
  items: Array<{
    product: mongoose.Types.ObjectId;
    name: string;
    quantity: number;
  }>;
  assignedTo?: mongoose.Types.ObjectId | null;
  status: "new" | "in_review" | "quoted" | "accepted" | "rejected" | "converted" | "closed";
  quotations: Array<{
    _id?: mongoose.Types.ObjectId;
    quotationNumber: string;
    items: Array<{
      product: mongoose.Types.ObjectId;
      name: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }>;
    subtotal: number;
    shippingCharge: number;
    discount: number;
    total: number;
    notes?: string | null;
    validUntil: Date;
    status: "draft" | "sent" | "accepted" | "rejected" | "expired" | "converting" | "converted";
    sentAt?: Date | null;
    decisionAt?: Date | null;
    convertedOrder?: mongoose.Types.ObjectId | null;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

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

const itemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const quotationItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const quotationSchema = new Schema(
  {
    quotationNumber: { type: String, required: true, unique: true },
    items: { type: [quotationItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    shippingCharge: { type: Number, required: true, min: 0 },
    discount: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    notes: { type: String, default: null, trim: true },
    validUntil: { type: Date, required: true },
    status: {
      type: String,
      enum: ["draft", "sent", "accepted", "rejected", "expired", "converting", "converted"],
      default: "draft",
    },
    sentAt: { type: Date, default: null },
    decisionAt: { type: Date, default: null },
    convertedOrder: { type: Schema.Types.ObjectId, ref: "Order", default: null },
  },
  { timestamps: true }
);

const bulkEnquirySchema = new Schema<IBulkEnquiry>(
  {
    referenceNumber: { type: String, required: true, unique: true, index: true },
    customer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    contactName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    message: { type: String, default: "", trim: true, maxlength: 3000 },
    shippingAddress: { type: shippingAddressSchema, required: true },
    items: { type: [itemSchema], required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null },
    status: {
      type: String,
      enum: ["new", "in_review", "quoted", "accepted", "rejected", "converted", "closed"],
      default: "new",
    },
    quotations: { type: [quotationSchema], default: [] },
  },
  { timestamps: true }
);

bulkEnquirySchema.index({ status: 1, createdAt: -1 });

export default model<IBulkEnquiry>("BulkEnquiry", bulkEnquirySchema);
