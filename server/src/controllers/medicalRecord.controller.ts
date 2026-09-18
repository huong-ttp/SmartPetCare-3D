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

export const getMedicalRecordById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ownerId = req.user!.user_id;
    const recordId = Number(req.params.id);

    const record = await medicalRecordService.getMedicalRecordById(
      ownerId,
      recordId
    );

    res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getMedicalRecordsByPet,
  getMedicalRecordById,
};