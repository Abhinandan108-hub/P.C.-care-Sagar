import { Router } from "express";
import { body } from "express-validator";
import { authenticate, authorizeRoles } from "../middlewares/auth";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController";
import { validateRequest } from "../middlewares/validate";

const router = Router();

router.get("/", getProducts);
router.get("/:id", authenticate, getProductById);

const productValidators = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("category").trim().notEmpty().withMessage("Category is required"),
  body("brand").trim().notEmpty().withMessage("Brand is required"),
  body("price").isNumeric().withMessage("Price must be a number"),
  body("mrp").isNumeric().withMessage("MRP must be a number"),
  body("stock").isNumeric().withMessage("Stock must be a number"),
];

router.post("/", authenticate, productValidators, validateRequest, createProduct);
router.patch("/:id", authenticate, productValidators, validateRequest, updateProduct);
router.delete("/:id", authenticate, deleteProduct);

export default router;
