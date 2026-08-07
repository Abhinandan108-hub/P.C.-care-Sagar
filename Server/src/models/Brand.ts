import mongoose, { Schema, model } from "mongoose";

export interface IBrand {
  name: string;
  logo_url?: string | null;
  image_url?: string | null;
  category_id?: string | null;
  description?: string | null;
  status: "active" | "inactive";
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const brandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true, trim: true },
    logo_url: { type: String, default: null },
    image_url: { type: String, default: null },
    category_id: { type: String, default: null },
    description: { type: String, default: null },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default model<IBrand>("Brand", brandSchema);
