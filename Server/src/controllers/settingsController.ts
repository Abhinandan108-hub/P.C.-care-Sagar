import { Request, Response } from "express";
import Settings from "../models/Settings";

const allowedSettings = [
  "company_name",
  "tagline",
  "logo_url",
  "favicon_url",
  "hero_banner_url",
  "hero_title",
  "hero_subtitle",
  "whatsapp_number",
  "phone_number",
  "email",
  "address",
  "google_map_link",
  "facebook_url",
  "instagram_url",
  "linkedin_url",
  "youtube_url",
  "business_hours",
  "footer_text",
  "copyright_text",
] as const;

export async function getSettings(req: Request, res: Response) {
  const settings = await Settings.findOne();
  return res.status(200).json({ success: true, data: settings });
}

export async function updateSettings(req: Request, res: Response) {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ success: false, message: "Settings must be sent as an object" });
  }
  const updates: Record<string, unknown> = {};
  for (const key of allowedSettings) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, message: "No supported settings were provided" });
  }
  const settings = await Settings.findOneAndUpdate(
    {},
    { $set: updates },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
  return res.status(200).json({ success: true, data: settings });
}
