
import { Router } from "express";
import { body } from "express-validator";

import {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  changePassword,
  me,
  verifyEmail,
  resendVerificationEmail,
} from "../controllers/authController";

import { authenticate } from "../middlewares/auth";
import { validateRequest } from "../middlewares/validate";

const router = Router();

router.get("/verify-email", verifyEmail);
router.post(
  "/verify-email",
  [body("token").isString().notEmpty()],
  validateRequest,
  verifyEmail
);
router.post(
  "/resend-verification",
  [body("email").isEmail().withMessage("Valid email is required")],
  validateRequest,
  resendVerificationEmail
);

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  validateRequest,
  register
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validateRequest,
  login
);

// Refresh token is read from the HttpOnly cookie.
router.post("/refresh", refreshToken);

// Authenticated routes
router.post("/logout", authenticate, logout);
router.post("/logout-all", authenticate, logoutAll);
router.get("/me", authenticate, me);

router.post(
  "/forgot-password",
  [
    body("email").isEmail().withMessage("Valid email is required"),
  ],
  validateRequest,
  forgotPassword
);

router.post(
  "/reset-password",
  [
    body("token").notEmpty().withMessage("Reset token is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  validateRequest,
  resetPassword
);

router.patch(
  "/change-password",
  authenticate,
  [
    body("currentPassword").notEmpty(),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("New password must be at least 8 characters"),
  ],
  validateRequest,
  changePassword
);

export default router;
