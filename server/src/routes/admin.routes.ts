import { Router } from "express";

import adminController from "../controllers/admin.controller";

import authMiddleware, {
  authorize
} from "../middleware/auth.middleware";

import {
  getDashboard,
  listUsers,
  createUser,
  updateUserRole,
  toggleUserActive,

  listPets,
  getPetById,
  updatePet,
  deletePet,

  listAppointments,
  listDoctors,
  assignDoctor,
  cancelAppointment,
  

} from "../controllers/admin.controller";
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

router.get(
  "/appointments",
  authMiddleware,
  authorize("admin"),
  adminController.listAppointments
);


// Appointment Management



router.get(
  "/doctors",
  authMiddleware,
  authorize("admin"),
  listDoctors
);

router.put(
  "/appointments/:id/assign",
  authMiddleware,
  authorize("admin"),
  assignDoctor
);

router.put(
  "/appointments/:id/cancel",
  authMiddleware,
  authorize("admin"),
  cancelAppointment
);

router.get(
  "/medical-records",
  authMiddleware,
  authorize("admin"),
  adminController.listMedicalRecords
);
export default router;