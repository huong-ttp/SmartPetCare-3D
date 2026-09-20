import { Request, Response, NextFunction } from "express";
import vaccinationService from "../services/vaccination.service";

export const getVaccinationsByPet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ownerId = req.user!.user_id;
    const role = req.user!.role;
    const petId = Number(req.params.petId);

    const vaccinations = await vaccinationService.getVaccinationsByPet(
      ownerId,
      petId,
      role
    );

    res.json({
      success: true,
      data: vaccinations,
    });
  } catch (error) {
    next(error);
  }
};

export const createVaccination = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const doctorId = req.user!.user_id;

    const appointmentId = req.params.appointmentId
      ? Number(req.params.appointmentId)
      : null;

    const items = Array.isArray(req.body)
      ? req.body
      : Array.isArray(req.body?.vaccinations)
      ? req.body.vaccinations
      : [req.body];

    const results = [];
    for (const item of items) {
      const result = await vaccinationService.createVaccination(
        doctorId,
        appointmentId,
        item
      );
      results.push(result.vaccination);
    }

    res.status(201).json({
      success: true,
      data: Array.isArray(req.body) || Array.isArray(req.body?.vaccinations) ? results : results[0],
      message: "Vaccination created successfully."
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
  getVaccinationsByPet,
  createVaccination,
  updateVaccination,
  deleteVaccination
};
