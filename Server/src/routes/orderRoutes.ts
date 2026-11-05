import { Router } from "express";
import { body } from "express-validator";
import { authenticate, authorizeRoles } from "../middlewares/auth";
import {
  cancelOrder,
  createOrder,
  getInvoice,
  getMyOrders,
  getOrderDetails,
  listAllOrders,
  updateOrderStatus,
  validateCheckout,
} from "../controllers/orderController";
import { refundPayment } from "../controllers/paymentController";
import { validateRequest } from "../middlewares/validate";

const router = Router();

const addressRules = [
  body("shippingAddress").isObject().withMessage("Shipping address is required"),
  body("shippingAddress.fullName").isString().trim().notEmpty(),
  body("shippingAddress.phone").isString().trim().matches(/^[0-9+()\-\s]{7,20}$/),
  body("shippingAddress.addressLine1").isString().trim().notEmpty(),
  body("shippingAddress.addressLine2").optional({ nullable: true }).isString(),
  body("shippingAddress.city").isString().trim().notEmpty(),
  body("shippingAddress.state").isString().trim().notEmpty(),
  body("shippingAddress.postalCode").isString().trim().notEmpty().isLength({ max: 20 }),
  body("shippingAddress.country").isString().trim().notEmpty(),
  body("couponCode").optional().isString().trim().isLength({ max: 40 }),
];

router.use(authenticate);
router.get("/admin", authorizeRoles("admin"), listAllOrders);
router.post("/validate", authorizeRoles("customer"), addressRules, validateRequest, validateCheckout);
router.post("/", authorizeRoles("customer"), addressRules, body("paymentMethod").isIn(["cod", "razorpay"]), body("confirmPriceChanges").optional().isBoolean(), validateRequest, createOrder);
router.get("/", authorizeRoles("customer"), getMyOrders);
router.patch("/:id/status", authorizeRoles("admin"), body("status").isString(), body("trackingNumber").optional({ nullable: true }).isString(), validateRequest, updateOrderStatus);
router.post("/:id/refund", authorizeRoles("admin"), body("amount").optional().isFloat({ gt: 0 }), body("reason").optional().isString().isLength({ max: 200 }), validateRequest, (req, res, next) => {
  req.params.orderId = req.params.id;
  return refundPayment(req, res, next);
});
router.get("/:id/invoice", authorizeRoles("admin", "customer"), getInvoice);
router.get("/:id", authorizeRoles("admin", "customer"), getOrderDetails);
router.post("/:id/cancel", authorizeRoles("customer"), cancelOrder);

export default router;
