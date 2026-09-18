import { Router } from "express";
import authMiddleware, { authorize} from "../middleware/auth.middleware";
import vaccinationController from "../controllers/vaccination.controller";

const router = Router();

router.post(
  "/appointment/:appointmentId",
  authMiddleware,
  authorize("doctor"),
  vaccinationController.createVaccination
);

export default router;