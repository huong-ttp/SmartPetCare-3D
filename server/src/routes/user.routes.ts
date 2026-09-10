import { Router } from "express";
import validate from "../middleware/validate.middleware";
import userController from "../controllers/user.controller";
import authMiddleware from "../middleware/auth.middleware"
import {
  createUserSchema,
  updateProfileSchema,
} from "../validations/user.validation";
import { changePasswordSchema } from "../validations/user.validation";
const router = Router();

router.post(
  "/",
  validate(createUserSchema),
  (req, res) => {
    res.json({
      success: true,
      data: req.body,
    });
  }
);

router.put(
  "/profile",
  authMiddleware,
  validate(updateProfileSchema),
  userController.updateProfile
);

router.put(
  "/change-password",
  authMiddleware,
  validate(changePasswordSchema),
  userController.changePassword
);

export default router;