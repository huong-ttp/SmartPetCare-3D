import { Router } from "express";
import authMiddleware, {authorize} from "../middleware/auth.middleware";
import validate from "../middleware/validate.middleware";
import appointmentController from "../controllers/appointment.controller";
import {
  createAppointmentSchema,
  cancelAppointmentSchema,
} from "../validations/appointment.validation";

const router = Router();

router.post(
    "/",
    authMiddleware,
    validate(createAppointmentSchema),
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
  "/doctor/dashboard",
  authMiddleware,
  authorize("doctor"),
  appointmentController.getDoctorDashboard
);

router.get(
  "/doctor",
  authMiddleware,
  authorize("doctor"),
  appointmentController.getDoctorAppointments
);

router.get(
  "/doctor/:id",
  authMiddleware,
  authorize("doctor"),
  appointmentController.getDoctorAppointmentById
);

router.get(
  "/:id",
  authMiddleware,
  appointmentController.getAppointmentById
);

router.put(
  "/:id/cancel",
  authMiddleware,
  validate(cancelAppointmentSchema),
  appointmentController.cancelAppointment
);


export default router;