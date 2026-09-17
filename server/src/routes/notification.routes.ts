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
  "/:id/read",
  authMiddleware,
  notificationController.markAsRead
);



export default router;