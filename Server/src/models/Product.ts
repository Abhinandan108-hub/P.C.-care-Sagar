import mongoose, { Schema, model } from "mongoose";

export interface IProduct {
  name: string;
  description: string;
  price: number;
  mrp: number;
  offer_percentage: number;
  stock: number;
  category: string;
  brand: string;
  image_url?: string | null;
  gallery_images: string[];
  seller: mongoose.Types.ObjectId | string;
  status: "active" | "inactive";
  featured: boolean;
  latest: boolean;
  availability: "in_stock" | "out_of_stock" | "coming_soon";
  specifications: Array<{ key: string; value: string }>;
  highlights: string[];
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: null },
    price: { type: Number, default: 0 },
    mrp: { type: Number, default: 0 },
    offer_percentage: { type: Number, default: 0 },
    stock: { type: Number, default: 0 },
    category: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    image_url: { type: String, default: null },
    gallery_images: { type: [String], default: [] },
    seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    featured: { type: Boolean, default: false },
    latest: { type: Boolean, default: false },
    availability: {
      type: String,
      enum: ["in_stock", "out_of_stock", "coming_soon"],
      default: "in_stock",
    },
    specifications: {
      type: [
        {
          key: { type: String, trim: true, default: "" },
          value: { type: String, trim: true, default: "" },
        }
      ],
      default: [],
    },
    highlights: { type: [String], default: [] },
  },
  { timestamps: true }
);

export default model<IProduct>("Product", productSchema);
