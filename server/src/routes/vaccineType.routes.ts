import { Router } from "express";

import authMiddleware, {
  authorize
} from "../middleware/auth.middleware";

import vaccineTypeController
  from "../controllers/vaccineType.controller";

import {

  listVaccineTypes,

  createVaccineType,

  updateVaccineType,

  deleteVaccineType

} from "../controllers/vaccineType.controller";

const router = Router();

router.get(
  "/",
  authMiddleware,
  authorize(
    "doctor",
    "admin",
    "owner"
  ),
  vaccineTypeController.getAllVaccineTypes
);

router.use(
  authMiddleware,
  authorize("admin")
);

router.get(
  "/",
  listVaccineTypes
);

router.post(
  "/",
  createVaccineType
);

router.put(
  "/:id",
  updateVaccineType
);

router.delete(
  "/:id",
  deleteVaccineType
);

export default router;