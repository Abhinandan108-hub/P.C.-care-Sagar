import { Router } from "express";
import { body } from "express-validator";
import { authenticate, authorizeRoles } from "../middlewares/auth";
import {
  createCoupon,
  deleteCoupon,
  getCoupons,
  updateCoupon,
} from "../controllers/couponController";
import { validateRequest } from "../middlewares/validate";

const router = Router();

const couponRules = [
  body("code").isString().trim().notEmpty().isLength({ max: 40 }),
  body("type").isIn(["percentage", "fixed"]),
  body("amount").isFloat({ gt: 0 }),
  body("minimumSubtotal").optional().isFloat({ min: 0 }),
  body("maximumDiscount").optional({ nullable: true }).isFloat({ gt: 0 }),
  body("maxUses").optional({ nullable: true }).isInt({ min: 1 }),
  body("startsAt").optional({ nullable: true }).isISO8601(),
  body("expiresAt").optional({ nullable: true }).isISO8601(),
  body("isActive").optional().isBoolean(),
];

router.use(authenticate, authorizeRoles("admin"));
router.get("/", getCoupons);
router.post("/", couponRules, validateRequest, createCoupon);
router.patch(
  "/:id",
  [
    body("code").optional().isString().trim().notEmpty().isLength({ max: 40 }),
    body("type").optional().isIn(["percentage", "fixed"]),
    body("amount").optional().isFloat({ gt: 0 }),
    body("minimumSubtotal").optional().isFloat({ min: 0 }),
    body("maximumDiscount").optional({ nullable: true }).isFloat({ gt: 0 }),
    body("maxUses").optional({ nullable: true }).isInt({ min: 1 }),
    body("startsAt").optional({ nullable: true }).isISO8601(),
    body("expiresAt").optional({ nullable: true }).isISO8601(),
    body("isActive").optional().isBoolean(),
  ],
  validateRequest,
  updateCoupon
);
router.delete("/:id", deleteCoupon);

export default router;
