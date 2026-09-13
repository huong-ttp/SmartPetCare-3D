import { Router } from "express";
import petController from "../controllers/pet.controller";
import authMiddleware from "../middleware/auth.middleware";

const router = Router();

router.post(
  "/",
  authMiddleware,
  petController.createPet
);

export default router;