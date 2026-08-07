import { Router } from "express";
import { body } from "express-validator";
import { authenticate, authorizeRoles } from "../middlewares/auth";
import { getBrands, getBrandById, createBrand, updateBrand, deleteBrand } from "../controllers/brandController";
import { validateRequest } from "../middlewares/validate";

const router = Router();

router.get("/", getBrands);
router.get("/:id", getBrandById);
router.use(authenticate, authorizeRoles("admin"));
router.post(
  "/",
  [body("name").trim().notEmpty().withMessage("Name is required")],
  validateRequest,
  createBrand
);
router.patch(
  "/:id",
  [body("name").optional().trim().notEmpty().withMessage("Name is required")],
  validateRequest,
  updateBrand
);
router.delete("/:id", deleteBrand);

export default router;
