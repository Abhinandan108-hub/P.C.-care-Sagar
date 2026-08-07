import { Router } from "express";
import { body } from "express-validator";
import { authenticate, authorizeRoles } from "../middlewares/auth";
import {
  createEnquiry,
  getEnquiries,
  getEnquiryById,
  markEnquiryAsRead,
  deleteEnquiry,
} from "../controllers/enquiryController";
import { validateRequest } from "../middlewares/validate";

const router = Router();

router.post(
  "/",
  [body("name").trim().notEmpty().withMessage("Name is required"), body("message").trim().notEmpty().withMessage("Message is required")],
  validateRequest,
  createEnquiry
);

router.use(authenticate, authorizeRoles("admin"));
router.get("/", getEnquiries);
router.get("/:id", getEnquiryById);
router.patch("/:id/read", markEnquiryAsRead);
router.delete("/:id", deleteEnquiry);

export default router;
