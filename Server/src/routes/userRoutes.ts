
import { Router } from "express";

import {
  getUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getProfile,
  updateProfile,
  createStaff,
  getCustomers,
  getStaff,
  getCustomerHistory,
  updateUserInformation,
  updateUserPermissions,
} from "../controllers/userController";

import {
  authenticate,
  authorizeRoles,
  authorizePermissions,
} from "../middlewares/auth";
import { body } from "express-validator";
import { validateRequest } from "../middlewares/validate";

const router = Router();

router.use(authenticate);

// Any authenticated user can access and update their own profile.
router.get("/me", getProfile);
router.patch("/me", updateProfile);

// Admin-only user management.
router.get("/customers", authorizePermissions("customers.read"), getCustomers);
router.get("/staff", authorizeRoles("admin"), getStaff);
router.get("/customers/:id/history", authorizePermissions("customers.read"), getCustomerHistory);
router.post(
  "/staff",
  authorizeRoles("admin"),
  [
    body("name").isString().trim().notEmpty(),
    body("email").isEmail(),
    body("role").isIn(["seller", "technician"]),
    body("phone").optional({ nullable: true }).isString(),
    body("permissions").optional().isArray(),
    body("permissions.*").optional().isString(),
  ],
  validateRequest,
  createStaff
);
router.get("/", authorizeRoles("admin"), getUsers);
router.get("/:id", authorizeRoles("admin"), getUserById);
router.patch(
  "/:id/permissions",
  authorizeRoles("admin"),
  [
    body("permissions").isArray(),
    body("permissions.*").isString(),
  ],
  validateRequest,
  updateUserPermissions
);
router.patch(
  "/:id",
  authorizePermissions("customers.read"),
  [
    body("name").optional().isString().trim().notEmpty(),
    body("phone").optional({ nullable: true }).isString(),
    body("company").optional({ nullable: true }).isString(),
  ],
  validateRequest,
  updateUserInformation
);

router.patch(
  "/:id/role",
  authorizeRoles("admin"),
  updateUserRole
);

router.patch(
  "/:id/status",
  authorizeRoles("admin"),
  updateUserStatus
);

// Legacy DELETE endpoint now deactivates the account.
router.delete(
  "/:id",
  authorizeRoles("admin"),
  deleteUser
);

export default router;
