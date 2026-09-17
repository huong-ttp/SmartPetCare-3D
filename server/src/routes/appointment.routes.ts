import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware"
import appointmentController from "../controllers/appointment.controller"

const router = Router();

router.post(
    "/",
    authMiddleware,
    appointmentController.createAppointment
);

router.get(
  "/",
  authMiddleware,
  appointmentController.getAppointmentsByOwner
);

router.get(
  "/available-slots",
  authMiddleware,
  appointmentController.getAvailableSlots
);

router.get(
  "/:id",
  authMiddleware,
  appointmentController.getAppointmentById
);

router.put(
  "/:id/cancel",
  authMiddleware,
  appointmentController.cancelAppointment
);
export default router;