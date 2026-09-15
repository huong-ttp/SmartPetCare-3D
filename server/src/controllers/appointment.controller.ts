import { Request, Response, NextFunction } from "express";
import appointmentService from "../services/appointment.service";

export const createAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    const ownerId = req.user!.user_id;

    const appointment =
      await appointmentService.createAppointment(
        ownerId,
        req.body
      );

    res.status(201).json({
      success: true,
      data: appointment,
    });

  } catch (error) {
    next(error);
  }
};


export const getAppointmentsByOwner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const ownerId = req.user!.user_id;

    const appointments =
      await appointmentService.getAppointmentsByOwner(
        ownerId
      );

    res.json({
      success: true,
      data: appointments
    });

  } catch (error) {
    next(error);
  }

};

export const getAppointmentById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const ownerId = req.user!.user_id;

    const appointmentId = Number(
      req.params.id
    );

    const appointment =
      await appointmentService.getAppointmentById(
        ownerId,
        appointmentId
      );

    res.json({
      success: true,
      data: appointment
    });

  } catch (error) {
    next(error);
  }

};

export const cancelAppointment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    const ownerId = req.user!.user_id;

    const appointmentId = Number(
      req.params.id
    );

    const appointment =
      await appointmentService.cancelAppointment(
        ownerId,
        appointmentId,
        req.body
      );

    res.json({
      success: true,
      data: appointment,
    });

  } catch (error) {
    next(error);
  }
};
export default {
  createAppointment,
   getAppointmentsByOwner,
   getAppointmentById,
   cancelAppointment,

};

