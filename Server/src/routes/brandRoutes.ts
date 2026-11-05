import { Router } from "express";
import { body } from "express-validator";
import { authenticate, authorizeRoles, optionalAuthenticate } from "../middlewares/auth";
import {
  getBrands,
  getBrandById,
  getBrandProducts,
  createBrand,
  updateBrand,
  deleteBrand,
} from "../controllers/brandController";
import { validateRequest } from "../middlewares/validate";

const router = Router();

router.get("/", optionalAuthenticate, getBrands);
router.get("/:id/products", optionalAuthenticate, getBrandProducts);
router.get("/:id", optionalAuthenticate, getBrandById);
router.use(authenticate, authorizeRoles("admin"));
router.post(
  "/",
  [
    body("name").isString().trim().notEmpty().withMessage("Name is required"),
    body("logo_url").optional({ nullable: true }).isString(),
    body("image_url").optional({ nullable: true }).isString(),
    body("category_id").optional({ nullable: true }).isMongoId(),
    body("description").optional({ nullable: true }).isString(),
    body("status").optional().isIn(["active", "inactive"]),
    body("featured").optional().isBoolean(),
  ],
  validateRequest,
  createBrand
);
router.patch(
  "/:id",
  [
    body("name").optional().isString().trim().notEmpty().withMessage("Name is required"),
    body("logo_url").optional({ nullable: true }).isString(),
    body("image_url").optional({ nullable: true }).isString(),
    body("category_id").optional({ nullable: true }).isMongoId(),
    body("description").optional({ nullable: true }).isString(),
    body("status").optional().isIn(["active", "inactive"]),
    body("featured").optional().isBoolean(),
  ],
  validateRequest,
  updateBrand
);
router.delete("/:id", deleteBrand);

export default router;
