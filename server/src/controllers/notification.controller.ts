import { Request, Response, NextFunction } from "express";
import notificationService from "../services/notification.service";

export const getReminderNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const userId = req.user!.user_id;

    const reminders =
      await notificationService.getReminderNotifications(
        userId,
        {
          type: req.query.type as string
        }
      );

    res.json({
      success: true,
      data: reminders
    });

  } catch (error) {
    next(error);
  }

};

export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const ownerId = req.user!.user_id;

    const notificationId = Number(
      req.params.id
    );

    const notification =
      await notificationService.markAsRead(
        ownerId,
        notificationId
      );

    res.json({
      success: true,
      data: notification
    });

  } catch (error) {
    next(error);
  }



};

export default {
  getReminderNotifications,
  markAsRead

};