import { Request, Response } from "express";
import Settings from "../models/Settings";

export async function getSettings(req: Request, res: Response) {
  const settings = await Settings.findOne();
  return res.status(200).json({ success: true, data: settings });
}

export async function updateSettings(req: Request, res: Response) {
  const settings = await Settings.findOneAndUpdate({}, req.body, { new: true, upsert: true });
  return res.status(200).json({ success: true, data: settings });
}
