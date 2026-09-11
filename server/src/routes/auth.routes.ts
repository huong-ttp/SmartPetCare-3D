import { Router } from "express";
import authController from "../controllers/auth.controller";
import validate from "../middleware/validate.middleware";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from "../validations/auth.validation";
import authMiddleware from "../middleware/auth.middleware";
import authorize from "../middleware/role.middleware";
const router = Router();

router.post(
  "/register",
  validate(registerSchema),
  authController.register
);

router.post(
  "/login",
  validate(loginSchema),
  authController.login
);

router.get(
  "/me",
  authMiddleware,
  authController.me
);

router.get(
  "/admin",
  authMiddleware,
  authorize("admin"),
  (req, res) => {
    res.json({
      success: true,
      message: "Welcome Admin",
    });
  }
);

router.get(
  "/profile",
  authMiddleware,
  authController.profile
);

router.post(
  "/refresh",
  validate(refreshTokenSchema),
  authController.refresh
);

export default router;