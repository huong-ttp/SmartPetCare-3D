import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import vaccinationController from "../controllers/vaccination.controller";

const router = Router();

router.get(
  "/pet/:petId",
  authMiddleware,
  vaccinationController.getVaccinationsByPet
);

export default router;
