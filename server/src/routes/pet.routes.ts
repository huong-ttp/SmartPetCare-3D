import { Router } from "express";
import petController from "../controllers/pet.controller";
import authMiddleware from "../middleware/auth.middleware";

const router = Router();

router.post(
  "/",
  authMiddleware,
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

export default router;