import { Router } from "express";
import authMiddleware, { authorize } from "../middleware/auth.middleware";
import shiftController from "../controllers/shift.controller";

const router = Router();

// Bác sĩ xem ca trực của mình: GET /api/doctor/shifts
router.get(
  "/doctor/shifts",
  authMiddleware,
  authorize("doctor"),
  shiftController.getMyShifts
);

// Admin quản lý ca trực: /api/admin/shifts
router.get(
  "/admin/shifts",
  authMiddleware,
  authorize("admin"),
  shiftController.listShifts
);

router.post(
  "/admin/shifts",
  authMiddleware,
  authorize("admin"),
  shiftController.createShifts
);

router.put(
  "/admin/shifts/:id",
  authMiddleware,
  authorize("admin"),
  shiftController.updateShift
);

router.delete(
  "/admin/shifts/:id",
  authMiddleware,
  authorize("admin"),
  shiftController.deleteShift
);

export default router;
