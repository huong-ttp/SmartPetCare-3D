import { Router } from "express";
import medicalRecordController from "../controllers/medicalRecord.controller";
import authMiddleware, {
  authorize
} from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/pet/:petId",
  authMiddleware,
  medicalRecordController.getMedicalRecordsByPet
);

router.post(
  "/appointment/:appointmentId",
  authMiddleware,
  authorize("doctor"),
  medicalRecordController.createMedicalRecord
);

router.get(
  "/doctor/patients",
  authMiddleware,
  authorize("doctor"),
  medicalRecordController.listPatientsByDoctor
);

router.get(
  "/:id",
  authMiddleware,
  medicalRecordController.getMedicalRecordById
);

router.put(
  "/:id",
  authMiddleware,
  authorize("doctor", "admin"),
  medicalRecordController.updateMedicalRecord
);

router.delete(
  "/:id",
  authMiddleware,
  authorize("doctor", "admin"),
  medicalRecordController.deleteMedicalRecord
);
export default router;