import { Router } from "express";
import authController from "../controllers/auth.controller";
import validate from "../middleware/validate.middleware";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validations/auth.validation";
import authMiddleware from "../middleware/auth.middleware";
import authorize from "../middleware/role.middleware";
import { uploadRegistrationAvatars } from "../middleware/upload.middleware";

const router = Router();

/**
 * POST /api/auth/register  (Content-Type: multipart/form-data)
 * - Text fields: full_name, email, password, phone?, address?,
 *                pet_name?, pet_species?, pet_breed?, pet_gender?
 * - File fields: avatar? (ảnh người dùng), petAvatar? (ảnh thú cưng) — tối đa 5MB/ảnh
 *
 * Thứ tự middleware: upload (parse multipart + đẩy ảnh lên Cloudinary)
 * -> validate (req.body đã có dữ liệu text) -> controller.
 */
router.post(
  "/register",
  uploadRegistrationAvatars,
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
  "/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  "/refresh",
  validate(refreshTokenSchema),
  authController.refresh
);

router.post(
  "/logout",
  authMiddleware,
  authController.logout
);

router.post(
  "/reset-password",
  authController.resetPassword
);

export default router;