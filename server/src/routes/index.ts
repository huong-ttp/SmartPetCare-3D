import { Router } from "express";

import healthRoutes from "./health.routes";
import authRoutes from "./auth.routes";
import petRoutes from "./pet.routes";
import appointmentRoutes from "./appointment.routes";
import medicalRecordRoutes from "./medicalRecord.route";
import paymentRoutes from "./payment.routes";
import dashboardRoutes from "./dashboard.routes";
import userRoutes from "./user.routes";
import vaccinationRoutes from "./vaccination.routes";
import vaccineTypeRoutes from "./vaccineType.routes";
import serviceRoutes from "./service.routes";
import adminRoutes from "./admin.routes";
import invoiceRoutes from "./invoice.routes";
import notificationRoutes from "./notification.routes";
import healthLogRoutes from "./healthLog.routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/health-logs", healthLogRoutes);
router.use("/auth", authRoutes);
router.use("/pets", petRoutes);
router.use("/appointments", appointmentRoutes);
router.use("/medical-records", medicalRecordRoutes);
router.use("/payments", paymentRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/users", userRoutes);
router.use("/vaccinations", vaccinationRoutes);
router.use("/vaccine-types", vaccineTypeRoutes);
router.use("/admin/vaccine-types", vaccineTypeRoutes);
router.use("/services", serviceRoutes);
router.use("/admin", adminRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/notifications", notificationRoutes);
router.use("/user-notifications", notificationRoutes);
export default router;