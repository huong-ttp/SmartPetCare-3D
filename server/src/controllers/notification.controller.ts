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

export const listNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const notifications =
      await notificationService.listNotifications({

        search:
          req.query.search as string,

        type:
          req.query.type as string,

        fromDate:
          req.query.fromDate as string,

        toDate:
          req.query.toDate as string,

        page:
          Number(req.query.page) || 1,

        limit:
          Number(req.query.limit) || 10

      });

    res.json({

      success: true,

      data: notifications

    });

  } catch (err) {

    next(err);

  }

};

export const sendSystemNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const result =
      await notificationService.sendSystemNotification(
        req.body
      );

    res.status(201).json({

      success: true,

      message:
        "System notification sent successfully",

      data: result

    });

  }

  catch (err) {

    next(err);

  }

};
export default {
  getReminderNotifications,
  getNotifications,
  markAsRead,
  markAllAsRead,
  listNotifications,
  sendSystemNotification

};