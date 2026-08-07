import { Router } from "express";
import { authenticate, authorizeRoles } from "../middlewares/auth";
import { getUsers, getUserById, updateUserRole, deleteUser } from "../controllers/userController";

const router = Router();

router.use(authenticate, authorizeRoles("admin"));
router.get("/", getUsers);
router.get("/:id", getUserById);
router.patch("/:id", updateUserRole);
router.delete("/:id", deleteUser);

export default router;
