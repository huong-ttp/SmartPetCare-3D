import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import serviceController from "../controllers/service.controller";

const router = Router();

router.get(
  "/",
  authMiddleware,
  serviceController.getActiveServices
);

export default router;