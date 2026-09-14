import { Router } from "express";

import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import petRoutes from "./pet.routes";
import appointmentRoutes from "./appointment.routes";
import medicalRecordRoutes from "./medical-record.routes";
import paymentRoutes from "./payment.routes";
import dashboardRoutes from "./dashboard.routes";
import userRoutes from "./user.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/pets", petRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/medical-records", medicalRecordRoutes);
router.use("/payments", paymentRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/users", userRoutes);
export default router;