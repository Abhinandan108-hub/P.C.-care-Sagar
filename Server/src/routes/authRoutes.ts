import { Router } from "express";
import { body } from "express-validator";
import { register, login, me } from "../controllers/authController";
import { validateRequest } from "../middlewares/validate";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("A valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  validateRequest,
  register
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("A valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validateRequest,
  login
);

router.get("/me", authenticate, me);

export default router;
