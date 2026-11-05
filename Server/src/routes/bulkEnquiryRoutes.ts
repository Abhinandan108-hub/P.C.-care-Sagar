import { Router } from "express";
import { body } from "express-validator";
import { authenticate, authorizeRoles } from "../middlewares/auth";
import {
  assignBulkEnquiry,
  convertQuotationToOrder,
  createBulkEnquiry,
  createQuotation,
  decideQuotation,
  downloadQuotationPdf,
  getBulkEnquiry,
  getBulkEnquiries,
  sendQuotation,
  setBulkEnquiryProducts,
  updateBulkEnquiry,
  updateBulkEnquiryStatus,
  updateQuotation,
} from "../controllers/bulkEnquiryController";
import { validateRequest } from "../middlewares/validate";

const router = Router();

router.use(authenticate);
router.post(
  "/",
  authorizeRoles("customer"),
  [
    body("company").isString().trim().notEmpty().isLength({ max: 150 }),
    body("phone").isString().trim().matches(/^[0-9+()\-\s]{7,20}$/),
    body("message").optional().isString().isLength({ max: 3000 }),
    body("shippingAddress").isObject(),
    body("shippingAddress.fullName").isString().trim().notEmpty(),
    body("shippingAddress.phone").isString().trim().notEmpty(),
    body("shippingAddress.addressLine1").isString().trim().notEmpty(),
    body("shippingAddress.addressLine2").optional({ nullable: true }).isString(),
    body("shippingAddress.city").isString().trim().notEmpty(),
    body("shippingAddress.state").isString().trim().notEmpty(),
    body("shippingAddress.postalCode").isString().trim().notEmpty().isLength({ max: 20 }),
    body("shippingAddress.country").isString().trim().notEmpty(),
    body("items").isArray({ min: 1, max: 50 }),
    body("items.*.productId").isMongoId(),
    body("items.*.quantity").isInt({ min: 1 }),
  ],
  validateRequest,
  createBulkEnquiry
);
router.get("/", authorizeRoles("customer", "admin", "seller"), getBulkEnquiries);
router.post(
  "/:id/assign",
  authorizeRoles("admin"),
  [body("staffId").isMongoId()],
  validateRequest,
  assignBulkEnquiry
);
router.patch(
  "/:id/status",
  authorizeRoles("admin", "seller"),
  [body("status").isIn(["in_review", "closed"])],
  validateRequest,
  updateBulkEnquiryStatus
);
router.put(
  "/:id/products",
  authorizeRoles("admin", "seller"),
  [
    body("items").isArray({ min: 1, max: 50 }),
    body("items.*.productId").isMongoId(),
    body("items.*.quantity").isInt({ min: 1 }),
  ],
  validateRequest,
  setBulkEnquiryProducts
);
router.post(
  "/:id/quotations",
  authorizeRoles("admin", "seller"),
  [
    body("items").isArray({ min: 1, max: 50 }),
    body("items.*.productId").isMongoId(),
    body("items.*.unitPrice").isFloat({ min: 0 }),
    body("shippingCharge").optional().isFloat({ min: 0 }),
    body("discount").optional().isFloat({ min: 0 }),
    body("validDays").optional().isInt({ min: 1, max: 90 }),
    body("notes").optional({ nullable: true }).isString().isLength({ max: 1000 }),
  ],
  validateRequest,
  createQuotation
);
router.get(
  "/:id/quotations/:quotationId/pdf",
  authorizeRoles("customer", "admin", "seller"),
  downloadQuotationPdf
);
router.post("/:id/quotations/:quotationId/send", authorizeRoles("admin", "seller"), sendQuotation);
router.patch(
  "/:id/quotations/:quotationId",
  authorizeRoles("admin", "seller"),
  [
    body("items").optional().isArray({ min: 1, max: 50 }),
    body("items.*.productId").optional().isMongoId(),
    body("items.*.unitPrice").optional().isFloat({ min: 0 }),
    body("shippingCharge").optional().isFloat({ min: 0 }),
    body("discount").optional().isFloat({ min: 0 }),
    body("validDays").optional().isInt({ min: 1, max: 90 }),
    body("notes").optional({ nullable: true }).isString().isLength({ max: 1000 }),
  ],
  validateRequest,
  updateQuotation
);
router.post(
  "/:id/quotations/:quotationId/decision",
  authorizeRoles("customer"),
  [body("decision").isIn(["accepted", "rejected"])],
  validateRequest,
  decideQuotation
);
router.post(
  "/:id/quotations/:quotationId/convert",
  authorizeRoles("customer"),
  convertQuotationToOrder
);
router.patch(
  "/:id",
  authorizeRoles("customer", "admin", "seller"),
  [
    body("company").optional().isString().trim().notEmpty().isLength({ max: 150 }),
    body("phone").optional().isString().trim().matches(/^[0-9+()\-\s]{7,20}$/),
    body("message").optional().isString().isLength({ max: 3000 }),
  ],
  validateRequest,
  updateBulkEnquiry
);
router.get("/:id", authorizeRoles("customer", "admin", "seller"), getBulkEnquiry);

export default router;
