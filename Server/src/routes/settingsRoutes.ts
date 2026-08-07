import { Router } from "express";
import { authenticate, authorizeRoles } from "../middlewares/auth";
import { getSettings, updateSettings } from "../controllers/settingsController";

const router = Router();

router.get("/", authenticate, getSettings);
router.patch("/", authenticate, authorizeRoles("admin"), updateSettings);

export default router;
