import mongoose, { Schema, model } from "mongoose";

export interface IEnquiry {
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  subject?: string | null;
  message: string;
  product_id?: string | null;
  product_name?: string | null;
  contactMethod?: "Phone" | "WhatsApp" | "Email" | null;
  status: "new" | "read";
  createdAt: Date;
}

const enquirySchema = new Schema<IEnquiry>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, default: null, trim: true },
    phone: { type: String, default: null, trim: true },
    company: { type: String, default: null, trim: true },
    subject: { type: String, default: null, trim: true },
    message: { type: String, required: true, trim: true },
    product_id: { type: String, default: null, trim: true },
    product_name: { type: String, default: null, trim: true },
    contactMethod: {
      type: String,
      enum: ["Phone", "WhatsApp", "Email"],
      default: null,
      trim: true,
    },
    status: { type: String, enum: ["new", "read"], default: "new" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default model<IEnquiry>("Enquiry", enquirySchema);
