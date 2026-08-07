import { Router } from "express";
import { body } from "express-validator";
import { authenticate, authorizeRoles } from "../middlewares/auth";
import { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory } from "../controllers/categoryController";
import { validateRequest } from "../middlewares/validate";

const router = Router();

router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.use(authenticate, authorizeRoles("admin"));
router.post(
  "/",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("slug").trim().notEmpty().withMessage("Slug is required"),
  ],
  validateRequest,
  createCategory
);
router.patch(
  "/:id",
  [body("name").optional().trim().notEmpty().withMessage("Name is required")],
  validateRequest,
  updateCategory
);
router.delete("/:id", deleteCategory);

export default router;
