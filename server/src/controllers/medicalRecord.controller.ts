import { Request, Response, NextFunction } from "express";
import medicalRecordService from "../services/medicalRecord.service";

export const getMedicalRecordsByPet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ownerId = req.user!.user_id;

    const petId = Number(req.params.petId);

    const records =
      await medicalRecordService.getMedicalRecordsByPet(
        ownerId,
        petId
      );

    res.json({
      success: true,
      data: records,
    });

  } catch (error) {
    next(error);
  }
};

export default {
  getMedicalRecordsByPet,
};