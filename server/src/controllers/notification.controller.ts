import { Request, Response, NextFunction } from "express";
import notificationService from "../services/notification.service";

export const getReminderNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const userId = req.user!.user_id;

    let typeParam = req.query.type as any;
    if (typeof typeParam === "string" && typeParam.includes(",")) {
      typeParam = typeParam.split(",").map((t: string) => t.trim());
    }
    const unread = req.query.unread === "true" ? true : undefined;

    const reminders =
      await notificationService.getReminderNotifications(
        userId,
        {
          type: typeParam,
          unread
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

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const userId = req.user!.user_id;

    const notifications =
      await notificationService.getNotifications(
        userId,
        {
          unread:
            req.query.unread === "true",

          type:
            req.query.type as string,

          limit:
            req.query.limit
              ? Number(req.query.limit)
              : undefined
        }
      );

    res.json({
      success: true,
      data: notifications
    });

  } catch (error) {
    next(error);
  }

};

export const markAllAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const userId = req.user!.user_id;

    const result =
      await notificationService.markAllAsRead(
        userId
      );

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    next(error);
  }

};

export default {
  getReminderNotifications,
  getNotifications,
  markAsRead,
  markAllAsRead

};