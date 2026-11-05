import { Router } from "express";
import { body } from "express-validator";
import { authenticate, authorizeRoles } from "../middlewares/auth";
import {
  addCartItem,
  clearCart,
  createCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "../controllers/cartController";
import { validateRequest } from "../middlewares/validate";

const router = Router();

router.use(authenticate, authorizeRoles("customer"));
router.get("/", getCart);
router.post("/", createCart);
router.post(
  "/items",
  [
    body("productId").isMongoId().withMessage("A valid productId is required"),
    body("quantity").optional().isInt({ min: 1 }).withMessage("quantity must be a positive integer"),
  ],
  validateRequest,
  addCartItem
);
router.patch(
  "/items/:productId",
  [
    body("quantity").isInt({ min: 1 }).withMessage("quantity must be a positive integer"),
  ],
  validateRequest,
  updateCartItem
);
router.delete("/items/:productId", removeCartItem);
router.delete("/", clearCart);
router.post("/clear", clearCart);

export default router;
