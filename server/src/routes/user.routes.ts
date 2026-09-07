import { Router } from "express";
import validate from "../middleware/validate.middleware";
import { createUserSchema } from "../validations/user.validation";
import userController from "../controllers/user.controller";
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

export default router;