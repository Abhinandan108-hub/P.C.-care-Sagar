import { Router } from "express";
import { body } from "express-validator";
import { authenticate, authorizeRoles, optionalAuthenticate } from "../middlewares/auth";
import {
  createProduct,
  deleteProduct,
  getFeaturedProducts,
  getLatestProducts,
  getProductById,
  getProductBySlug,
  getProducts,
  getProductsByAvailability,
  getRelatedProducts,
  updateProduct,
} from "../controllers/productController";
import { validateRequest } from "../middlewares/validate";

const router = Router();

const requiredProductFields = [
  body("name").isString().trim().notEmpty().withMessage("Name is required"),
  body("category").isString().trim().notEmpty().withMessage("Category is required"),
  body("brand").isString().trim().notEmpty().withMessage("Brand is required"),
  body("price").isFloat({ min: 0 }).withMessage("Price must be a non-negative number"),
  body("mrp").isFloat({ min: 0 }).withMessage("MRP must be a non-negative number"),
  body("stock").isInt({ min: 0 }).withMessage("Stock must be a non-negative integer"),
];

const optionalProductFields = [
  body("name").optional().isString().trim().notEmpty(),
  body("slug").optional().isString().trim().notEmpty(),
  body("description").optional({ nullable: true }).isString(),
  body("category").optional().isString().trim().notEmpty(),
  body("brand").optional().isString().trim().notEmpty(),
  body("price").optional().isFloat({ min: 0 }),
  body("mrp").optional().isFloat({ min: 0 }),
  body("offer_percentage").optional().isFloat({ min: 0, max: 100 }),
  body("stock").optional().isInt({ min: 0 }),
  body("image_url").optional({ nullable: true }).isString(),
  body("processor").optional({ nullable: true }).isString(),
  body("ram").optional({ nullable: true }).isString(),
  body("storage").optional({ nullable: true }).isString(),
  body("graphics").optional({ nullable: true }).isString(),
  body("display_size").optional({ nullable: true }).isString(),
  body("operating_system").optional({ nullable: true }).isString(),
  body("warranty").optional({ nullable: true }).isString(),
  body("gallery_images").optional().isArray(),
  body("gallery_images.*").isString(),
  body("specifications").optional().isArray(),
  body("specifications.*.key").isString().trim().notEmpty(),
  body("specifications.*.value").isString().trim().notEmpty(),
  body("highlights").optional().isArray(),
  body("highlights.*").isString(),
  body("featured").optional().isBoolean(),
  body("latest").optional().isBoolean(),
  body("status").optional().isIn(["active", "inactive"]),
  body("availability").optional().isIn(["in_stock", "out_of_stock", "coming_soon"]),
];

router.get("/", optionalAuthenticate, getProducts);
router.get("/featured", optionalAuthenticate, getFeaturedProducts);
router.get("/latest", optionalAuthenticate, getLatestProducts);
router.get("/availability/:availability", optionalAuthenticate, getProductsByAvailability);
router.get("/related/:id", optionalAuthenticate, getRelatedProducts);
router.get("/slug/:slug", optionalAuthenticate, getProductBySlug);
router.get("/:id", optionalAuthenticate, getProductById);

router.post(
  "/",
  authenticate,
  authorizeRoles("admin", "seller"),
  [...requiredProductFields, ...optionalProductFields],
  validateRequest,
  createProduct
);
router.patch(
  "/:id",
  authenticate,
  authorizeRoles("admin", "seller"),
  optionalProductFields,
  validateRequest,
  updateProduct
);
router.delete("/:id", authenticate, authorizeRoles("admin", "seller"), deleteProduct);

export default router;
