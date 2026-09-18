import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import medicalRecordController from "../controllers/medicalRecord.controller";

const router = Router();

router.get(
  "/pet/:petId",
  authMiddleware,
  medicalRecordController.getMedicalRecordsByPet
);

router.get(
  "/:id",
  authMiddleware,
  medicalRecordController.getMedicalRecordById
);

export default router;