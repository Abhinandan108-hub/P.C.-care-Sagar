import mongoose, { Schema, model } from "mongoose";

export interface ISettings {
  company_name: string;
  tagline: string;
  logo_url?: string | null;
  favicon_url?: string | null;
  hero_banner_url?: string | null;
  hero_title: string;
  hero_subtitle: string;
  whatsapp_number: string;
  phone_number: string;
  email: string;
  address: string;
  google_map_link: string;
  facebook_url: string;
  instagram_url: string;
  linkedin_url: string;
  youtube_url: string;
  business_hours: string;
  footer_text: string;
  copyright_text: string;
  updatedAt: Date;
}

const settingsSchema = new Schema<ISettings>(
  {
    company_name: { type: String, default: "" },
    tagline: { type: String, default: "" },
    logo_url: { type: String, default: null },
    favicon_url: { type: String, default: null },
    hero_banner_url: { type: String, default: null },
    hero_title: { type: String, default: "" },
    hero_subtitle: { type: String, default: "" },
    whatsapp_number: { type: String, default: "+916267808085" },
    phone_number: { type: String, default: "+916267808085" },
    email: { type: String, default: "abhinandansoni100@gmail.com" },
    address: { type: String, default: "" },
    google_map_link: { type: String, default: "" },
    facebook_url: { type: String, default: "" },
    instagram_url: { type: String, default: "" },
    linkedin_url: { type: String, default: "" },
    youtube_url: { type: String, default: "" },
    business_hours: { type: String, default: "" },
    footer_text: { type: String, default: "" },
    copyright_text: { type: String, default: "" },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export default model<ISettings>("Settings", settingsSchema);
