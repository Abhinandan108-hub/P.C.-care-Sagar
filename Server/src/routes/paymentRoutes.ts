import { Router } from "express";
import { body } from "express-validator";
import { authenticate, authorizeRoles } from "../middlewares/auth";
import {
  createPaymentOrder,
  getPaymentHistory,
  razorpayWebhook,
  syncPaymentStatus,
  verifyPayment,
} from "../controllers/paymentController";
import { validateRequest } from "../middlewares/validate";

const router = Router();

router.post("/webhook", razorpayWebhook);
router.use(authenticate, authorizeRoles("customer"));
router.post(
  "/orders",
  [body("orderId").isMongoId().withMessage("A valid orderId is required")],
  validateRequest,
  createPaymentOrder
);
router.post(
  "/verify",
  [
    body("gatewayOrderId").isString().notEmpty(),
    body("gatewayPaymentId").isString().notEmpty(),
    body("signature").isString().notEmpty(),
  ],
  validateRequest,
  verifyPayment
);
router.get("/history", getPaymentHistory);
router.get("/status/:orderId", syncPaymentStatus);

export default router;
