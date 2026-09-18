import { Request, Response, NextFunction } from "express";
import vaccinationService from "../services/vaccination.service";

export const getVaccinationsByPet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ownerId = req.user!.user_id;
    const petId = Number(req.params.petId);

    const vaccinations = await vaccinationService.getVaccinationsByPet(
      ownerId,
      petId
    );

    res.json({
      success: true,
      data: vaccinations,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getVaccinationsByPet,
};
