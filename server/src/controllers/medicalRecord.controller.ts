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

export const createMedicalRecord = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const doctorId = req.user!.user_id;

    const appointmentId = Number(
      req.params.appointmentId
    );

    const record =
      await medicalRecordService.createMedicalRecord(
        doctorId,
        appointmentId,
        req.body
      );

    res.status(201).json({
      success: true,
      data: record
    });

  } catch (error) {
    next(error);
  }
};

export const listPatientsByDoctor = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const doctorId = req.user!.user_id;

    const search =
      req.query.search as string | undefined;

    const patients =
      await medicalRecordService.listPatientsByDoctor(
        doctorId,
        search
      );

    res.json({
      success: true,
      data: patients
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getMedicalRecordsByPet,
  getMedicalRecordById,
  createMedicalRecord,
  listPatientsByDoctor,
};