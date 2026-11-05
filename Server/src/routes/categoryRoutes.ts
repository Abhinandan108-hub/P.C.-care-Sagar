import { Router } from "express";
import { body } from "express-validator";
import { authenticate, authorizeRoles, optionalAuthenticate } from "../middlewares/auth";
import {
  getCategories,
  getCategoryById,
  getCategoryProducts,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController";
import { validateRequest } from "../middlewares/validate";

const router = Router();

router.get("/", optionalAuthenticate, getCategories);
router.get("/:id/products", optionalAuthenticate, getCategoryProducts);
router.get("/:id", optionalAuthenticate, getCategoryById);
router.use(authenticate, authorizeRoles("admin"));
router.post(
  "/",
  [
    body("name").isString().trim().notEmpty().withMessage("Name is required"),
    body("slug").optional().isString().trim().notEmpty(),
    body("image_url").optional({ nullable: true }).isString(),
    body("display_order").optional().isInt(),
    body("status").optional().isIn(["active", "inactive"]),
    body("featured").optional().isBoolean(),
    body("description").optional({ nullable: true }).isString(),
  ],
  validateRequest,
  createCategory
);
router.patch(
  "/:id",
  [
    body("name").optional().isString().trim().notEmpty().withMessage("Name is required"),
    body("slug").optional().isString().trim().notEmpty(),
    body("image_url").optional({ nullable: true }).isString(),
    body("display_order").optional().isInt(),
    body("status").optional().isIn(["active", "inactive"]),
    body("featured").optional().isBoolean(),
    body("description").optional({ nullable: true }).isString(),
  ],
  validateRequest,
  updateCategory
);
router.delete("/:id", deleteCategory);

export default router;
