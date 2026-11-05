import { Router } from "express";
import { body } from "express-validator";
import { authenticate, authorizeRoles } from "../middlewares/auth";
import { getSettings, updateSettings } from "../controllers/settingsController";
import { validateRequest } from "../middlewares/validate";

const router = Router();

router.get("/", authenticate, getSettings);
router.patch(
  "/",
  authenticate,
  authorizeRoles("admin"),
  [
    body("company_name").optional().isString().isLength({ max: 150 }),
    body("tagline").optional().isString().isLength({ max: 300 }),
    body("logo_url").optional({ nullable: true }).isString().isLength({ max: 2000 }),
    body("favicon_url").optional({ nullable: true }).isString().isLength({ max: 2000 }),
    body("hero_banner_url").optional({ nullable: true }).isString().isLength({ max: 2000 }),
    body("hero_title").optional().isString().isLength({ max: 300 }),
    body("hero_subtitle").optional().isString().isLength({ max: 1000 }),
    body("whatsapp_number").optional().isString().matches(/^[0-9+()\-\s]{7,20}$/),
    body("phone_number").optional().isString().matches(/^[0-9+()\-\s]{7,20}$/),
    body("email").optional().isEmail(),
    body("address").optional().isString().isLength({ max: 1000 }),
    body("google_map_link").optional({ checkFalsy: true }).isURL({ require_protocol: true }),
    body("facebook_url").optional({ checkFalsy: true }).isURL({ require_protocol: true }),
    body("instagram_url").optional({ checkFalsy: true }).isURL({ require_protocol: true }),
    body("linkedin_url").optional({ checkFalsy: true }).isURL({ require_protocol: true }),
    body("youtube_url").optional({ checkFalsy: true }).isURL({ require_protocol: true }),
    body("business_hours").optional().isString().isLength({ max: 500 }),
    body("footer_text").optional().isString().isLength({ max: 2000 }),
    body("copyright_text").optional().isString().isLength({ max: 300 }),
  ],
  validateRequest,
  updateSettings
);

export default router;
