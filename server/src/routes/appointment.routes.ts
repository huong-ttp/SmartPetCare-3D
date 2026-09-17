import { Router } from "express";
import appointmentController from "../controllers/appointment.controller";
import authMiddleware from "../middleware/auth.middleware";

const router = Router();
router.get("/", authMiddleware, appointmentController.getMyAppointments);
export default router;