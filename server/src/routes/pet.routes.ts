import { Router } from "express";
import petController from "../controllers/pet.controller";
import authMiddleware from "../middleware/auth.middleware";
import validate from "../middleware/validate.middleware";

import {
  createPetSchema,
  updatePetSchema,
} from "../validations/pet.validation";
import { uploadSingleImage } from "../middleware/upload.middleware";

const router = Router();

router.post(
  "/",
  authMiddleware,
  uploadSingleImage("avatar"),
  validate(createPetSchema),
  petController.createPet
);

router.get(
  "/",
  authMiddleware,
  petController.getMyPets
);

router.get(
  "/:id",
  authMiddleware,
  petController.getPetById
);

router.put(
  "/:id",
  authMiddleware,
  uploadSingleImage("avatar"),
  validate(updatePetSchema),
  petController.updatePet
);

router.patch(
  "/:id",
  authMiddleware,
  uploadSingleImage("avatar"),
  validate(updatePetSchema),
  petController.updatePet
);

router.delete(
  "/:id",
  authMiddleware,
  petController.deletePet
);
export default router;