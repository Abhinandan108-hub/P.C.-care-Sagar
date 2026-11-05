import { NextFunction, Request, Response, Router } from "express";
import multer from "multer";
import { body } from "express-validator";
import { authenticate, authorizeRoles } from "../middlewares/auth";
import {
  addServiceNote,
  approveServiceEstimate,
  assignTechnician,
  cancelServiceRequest,
  completeService,
  createServiceRequest,
  downloadServiceBill,
  getMyServiceHistory,
  getServiceBilling,
  getServiceRequest,
  getServiceTracking,
  markServiceBillPaid,
  setFinalServiceCost,
  setServiceEstimate,
  updateServiceRequest,
  updateServiceStatus,
} from "../controllers/serviceController";
import { validateRequest } from "../middlewares/validate";
import { validateImageSignatures } from "../middlewares/secureUploads";

const router = Router();
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, done) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return done(new Error("Only JPG, PNG, and WebP images are allowed"));
    }
    return done(null, true);
  },
});

function uploadImages(req: Request, res: Response, next: NextFunction) {
  imageUpload.array("images", 5)(req, res, (error) => {
    if (error) return next(error);
    return validateImageSignatures(req, res, next);
  });
}

router.use(authenticate);
router.post(
  "/",
  authorizeRoles("customer"),
  uploadImages,
  [
    body("deviceType").isString().trim().notEmpty().isLength({ max: 100 }),
    body("brand").optional({ nullable: true }).isString().isLength({ max: 100 }),
    body("model").optional({ nullable: true }).isString().isLength({ max: 100 }),
    body("serialNumber").optional({ nullable: true }).isString().isLength({ max: 100 }),
    body("problemDescription").isString().trim().notEmpty().isLength({ max: 3000 }),
  ],
  validateRequest,
  createServiceRequest
);
router.get("/history", authorizeRoles("customer", "technician", "admin"), getMyServiceHistory);
router.get("/:id/tracking", authorizeRoles("customer", "technician", "admin"), getServiceTracking);
router.get("/:id/billing", authorizeRoles("customer", "technician", "admin"), getServiceBilling);
router.get("/:id/bill", authorizeRoles("customer", "admin", "technician"), downloadServiceBill);
router.post("/:id/billing/paid", authorizeRoles("admin"), markServiceBillPaid);
router.post("/:id/approve-estimate", authorizeRoles("customer"), approveServiceEstimate);
router.post("/:id/cancel", authorizeRoles("customer"), cancelServiceRequest);
router.post(
  "/:id/assign",
  authorizeRoles("admin"),
  [body("technicianId").isMongoId().withMessage("A valid technicianId is required")],
  validateRequest,
  assignTechnician
);
router.patch(
  "/:id/estimate",
  authorizeRoles("admin", "technician"),
  [body("estimatedCost").isFloat({ min: 0 })],
  validateRequest,
  setServiceEstimate
);
router.patch(
  "/:id/final-cost",
  authorizeRoles("admin", "technician"),
  [body("finalCost").isFloat({ min: 0 })],
  validateRequest,
  setFinalServiceCost
);
router.post(
  "/:id/complete",
  authorizeRoles("admin", "technician"),
  completeService
);
router.patch(
  "/:id/status",
  authorizeRoles("admin", "technician"),
  [
    body("status").isIn([
      "diagnosing",
      "awaiting_approval",
      "in_progress",
      "completed",
      "cancelled",
    ]),
    body("message").optional().isString().isLength({ max: 500 }),
  ],
  validateRequest,
  updateServiceStatus
);
router.post(
  "/:id/notes",
  authorizeRoles("customer", "technician", "admin"),
  [body("message").isString().trim().notEmpty().isLength({ max: 1000 })],
  validateRequest,
  addServiceNote
);
router.patch(
  "/:id",
  authorizeRoles("customer", "technician", "admin"),
  uploadImages,
  [
    body("deviceType").optional().isString().trim().notEmpty().isLength({ max: 100 }),
    body("brand").optional({ nullable: true }).isString().isLength({ max: 100 }),
    body("model").optional({ nullable: true }).isString().isLength({ max: 100 }),
    body("serialNumber").optional({ nullable: true }).isString().isLength({ max: 100 }),
    body("problemDescription").optional().isString().trim().notEmpty().isLength({ max: 3000 }),
  ],
  validateRequest,
  updateServiceRequest
);
router.get("/:id", authorizeRoles("customer", "technician", "admin"), getServiceRequest);

export default router;
