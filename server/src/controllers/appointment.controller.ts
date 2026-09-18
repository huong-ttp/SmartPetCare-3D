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
    ownerId,
    {
      status: req.query.status as string,
      from: req.query.from as string,
      to: req.query.to as string,
    }
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

export const getAvailableSlots = async (
  req: Request,
  res: Response,
  next: NextFunction,

) => {

  try {
    
    const ownerId = req.user!.user_id;

    const slots =
      await appointmentService.getAvailableSlots(
        ownerId,
        {
          pet_id: Number(req.query.pet_id),
          date: String(req.query.date)
        }
      );

    res.json({
      success: true,
      data: slots
    });

  } catch (error) {
    next(error);
  }


};

export const getDoctorAppointments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const doctorId = req.user!.user_id;

    const appointments =
      await appointmentService.getDoctorAppointments(
        doctorId,
        {
          tab: req.query.tab as
            | "today"
            | "upcoming"
            | "completed"
        }
      );

    res.json({
      success: true,
      data: appointments
    });

  } catch (error) {
    next(error);
  }

};

export const getDoctorAppointmentById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const doctorId = req.user!.user_id;

    const appointment =
      await appointmentService.getDoctorAppointmentById(
        doctorId,
        Number(req.params.id)
      );

    res.json({
      success: true,
      data: appointment
    });

  } catch (error) {
    next(error);
  }

};

export const getDoctorDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const doctorId = req.user!.user_id;

    const dashboard =
      await appointmentService.getDoctorDashboard(
        doctorId
      );

    res.json({
      success: true,
      data: dashboard
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
   getAvailableSlots,
   getDoctorAppointments,
   getDoctorAppointmentById,
   getDoctorDashboard

};



