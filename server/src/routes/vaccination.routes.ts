import { Router } from "express";
import authMiddleware, { authorize } from "../middleware/auth.middleware";
import vaccinationController from "../controllers/vaccination.controller";

const router = Router();

router.get(
  "/pet/:petId",
  authMiddleware,
  vaccinationController.getVaccinationsByPet
);

router.post(
  "/",
  authMiddleware,
  authorize("doctor", "admin"),
  vaccinationController.createVaccination
);

router.post(
  "/appointment/:appointmentId",
  authMiddleware,
  authorize("doctor", "admin"),
  vaccinationController.createVaccination
);

router.put(
  "/:id",
  authMiddleware,
  authorize("admin"),
  vaccinationController.updateVaccination
);

router.delete(
  "/:id",
  authMiddleware,
  authorize("admin"),
  vaccinationController.deleteVaccination
);

export default router;
