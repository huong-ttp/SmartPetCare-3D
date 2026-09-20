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

    let typeParam = req.query.type as any;
    if (typeof typeParam === "string" && typeParam.includes(",")) {
      typeParam = typeParam.split(",").map((t: string) => t.trim());
    }

    const unread =
      req.query.unread === "true"
        ? true
        : req.query.unread === "false"
        ? false
        : undefined;

    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const page = req.query.page ? Number(req.query.page) : undefined;
    const offset = req.query.offset
      ? Number(req.query.offset)
      : page && limit
      ? (page - 1) * limit
      : undefined;

    const notifications =
      await notificationService.getNotifications(
        userId,
        {
          unread,
          type: typeParam,
          limit,
          offset,
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