import { Router } from "express";

import adminController from "../controllers/admin.controller";

import authMiddleware, {
  authorize
} from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/dashboard",
  authMiddleware,
  authorize("admin"),
  adminController.getDashboard
);

router.get(
  "/users",
  authMiddleware,
  authorize("admin"),
  adminController.listUsers
);

router.post(
  "/users",
  authMiddleware,
  authorize("admin"),
  adminController.createUser
);

router.put(
  "/users/:id/role",
  authMiddleware,
  authorize("admin"),
  adminController.updateUserRole
);

router.patch(
  "/users/:id/toggle-active",
  authMiddleware,
  authorize("admin"),
  adminController.toggleUserActive
);

router.get(
  "/pets",
  authMiddleware,
  authorize("admin"),
  adminController.listPets
);

router.get(
  "/pets/:id",
  authMiddleware,
  authorize("admin"),
  adminController.getPetById
);

router.put(
  "/pets/:id",
  authMiddleware,
  authorize("admin"),
  adminController.updatePet
);

router.delete(
  "/pets/:id",
  authMiddleware,
  authorize("admin"),
  adminController.deletePet
);
export default router;