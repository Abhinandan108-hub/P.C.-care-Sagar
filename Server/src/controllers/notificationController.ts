import { Request, Response } from "express";
import Settings from "../models/Settings";
import { getWhatsAppContactLink } from "../utils/notifications";

export async function getWhatsAppContact(_req: Request, res: Response) {
  try {
    const settings = await Settings.findOne().select("whatsapp_number");
    const number = settings?.whatsapp_number || "";
    return res.status(200).json({
      success: true,
      data: {
        phoneNumber: number,
        contactLink: await getWhatsAppContactLink(),
        provider: process.env.WHATSAPP_PROVIDER || null,
        message: "Use the business WhatsApp number configured in website settings.",
      },
    });
  } catch (error) {
    console.error("Could not load WhatsApp contact settings:", error);
    return res.status(500).json({ success: false, message: "Could not load WhatsApp contact settings" });
  }
}
