import { Router } from "express";

import authMiddleware, {
  authorize
} from "../middleware/auth.middleware";

import vaccineTypeController
  from "../controllers/vaccineType.controller";

const router = Router();

router.get(
  "/",
  authMiddleware,
  authorize(
    "doctor",
    "admin"
  ),
  vaccineTypeController.getAllVaccineTypes
);

export default router;