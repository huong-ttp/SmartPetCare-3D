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

export const updateVaccination = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const vaccination =
      await vaccinationService.updateVaccination(

        Number(req.params.id),

        req.body

      );

    res.json({

      success: true,

      message:
        "Vaccination updated successfully",

      data: vaccination

    });

  } catch (err) {

    next(err);

  }

};

export const deleteVaccination = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const result =
      await vaccinationService.deleteVaccination(

        Number(req.params.id)

      );

    res.json({

      success: true,

      message: result.message

    });

  } catch (err) {

    next(err);

  }

};
export default {
  createVaccination,
  updateVaccination,
  deleteVaccination
};