import { Request, Response, NextFunction } from "express";
import vaccinationService from "../services/vaccination.service";

export const createVaccination = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const doctorId = req.user!.user_id;

    const appointmentId = Number(
      req.params.appointmentId
    );

    const vaccination =
      await vaccinationService.createVaccination(
        doctorId,
        appointmentId,
        req.body
      );

    res.status(201).json({
      success: true,
      data: vaccination
    });

  } catch (error) {
    next(error);
  }

};

export default {
  createVaccination
};