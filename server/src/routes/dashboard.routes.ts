import { Router } from "express";
import dashboardController from "../controllers/dashboard.controller";
import authMiddleware, { authorize } from "../middleware/auth.middleware";

const router = Router();

// GET /api/dashboard - Thống kê tổng quan tự động theo vai trò (Admin / Doctor / Owner)
router.get(
  "/",
  authMiddleware,
  dashboardController.getDashboard
);

// GET /api/dashboard/stats - Thống kê vĩ mô toàn hệ thống phòng khám
router.get(
  "/stats",
  authMiddleware,
  dashboardController.getGeneralStats
);

// GET /api/dashboard/admin - Thống kê chuyên sâu cho quản trị viên
router.get(
  "/admin",
  authMiddleware,
  authorize("admin"),
  dashboardController.getAdminDashboard
);

// GET /api/dashboard/doctor - Thống kê ca khám và bệnh nhân cho bác sĩ
router.get(
  "/doctor",
  authMiddleware,
  authorize("doctor"),
  dashboardController.getDoctorDashboard
);

export default router;