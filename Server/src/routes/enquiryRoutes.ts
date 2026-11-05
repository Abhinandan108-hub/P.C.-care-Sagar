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
  [
    body("name").isString().trim().notEmpty().isLength({ max: 100 }).withMessage("Name is required"),
    body("email").optional({ nullable: true }).isEmail(),
    body("phone").optional({ nullable: true }).isString().trim().matches(/^[0-9+()\-\s]{7,20}$/),
    body("company").optional({ nullable: true }).isString().isLength({ max: 150 }),
    body("subject").optional({ nullable: true }).isString().isLength({ max: 200 }),
    body("message").isString().trim().notEmpty().isLength({ max: 3000 }).withMessage("Message is required"),
    body("product_id").optional({ nullable: true }).isString().isLength({ max: 100 }),
    body("product_name").optional({ nullable: true }).isString().isLength({ max: 200 }),
    body("contactMethod").optional({ nullable: true }).isIn(["Phone", "WhatsApp", "Email"]),
  ],
  validateRequest,
  createEnquiry
);

router.use(authenticate, authorizeRoles("admin"));
router.get("/", getEnquiries);
router.get("/:id", getEnquiryById);
router.patch("/:id/read", markEnquiryAsRead);
router.delete("/:id", deleteEnquiry);

export default router;
