import { Router } from "express";
import { getWhatsAppContact } from "../controllers/notificationController";

const router = Router();

router.get("/whatsapp-contact", getWhatsAppContact);

export default router;
