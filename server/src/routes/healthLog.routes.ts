import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import healthLogController from "../controllers/healthLog.controller";

const router = Router();

router.post(
  "/",
  authMiddleware,
  healthLogController.createHealthLog
);

router.get(
  "/pet/:petId",
  authMiddleware,
  healthLogController.getHealthLogsByPet
);

router.get(
  "/pet/:petId/latest",
  authMiddleware,
  healthLogController.getLatestHealthLog
);

export default router;