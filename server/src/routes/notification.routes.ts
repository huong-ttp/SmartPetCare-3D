import { Router } from "express";
import authMiddleware from "../middleware/auth.middleware";
import notificationController from "../controllers/notification.controller";

const router = Router();

router.get(
  "/reminders",
  authMiddleware,
  notificationController.getReminderNotifications
);

router.put(
  "/read-all",
  authMiddleware,
  notificationController.markAllAsRead
);

router.put(
  "/:id/read",
  authMiddleware,
  notificationController.markAsRead
);

router.get(
  "/",
  authMiddleware,
  notificationController.getNotifications
);

export default router;