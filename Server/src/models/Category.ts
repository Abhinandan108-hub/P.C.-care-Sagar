import mongoose, { Schema, model } from "mongoose";

export interface ICategory {
  name: string;
  slug: string;
  image_url?: string | null;
  display_order: number;
  status: "active" | "inactive";
  featured: boolean;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    image_url: { type: String, default: null },
    display_order: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    featured: { type: Boolean, default: false },
    description: { type: String, default: null },
  },
  { timestamps: true }
);

export default model<ICategory>("Category", categorySchema);
