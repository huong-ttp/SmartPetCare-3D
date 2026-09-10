import { Router } from "express";
import authController from "../controllers/auth.controller";
import validate from "../middleware/validate.middleware";
import {
  registerSchema,
  loginSchema,
} from "../validations/auth.validation";
import authMiddleware from "../middleware/auth.middleware";
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
export default router;