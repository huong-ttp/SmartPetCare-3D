import { Router } from "express";
import validate from "../middleware/validate.middleware";
import { createUserSchema } from "../validations/user.validation";

const router = Router();

router.post(
  "/test",
  validate(createUserSchema),
  (req, res) => {
    res.json({
      success: true,
      data: req.body,
    });
  }
);

export default router;