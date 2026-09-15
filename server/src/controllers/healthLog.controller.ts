import { Request, Response, NextFunction } from "express";
import healthLogService from "../services/healthLog.service";

export const createHealthLog = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ownerId = req.user!.user_id;

    const healthLog =
      await healthLogService.createHealthLog(
        ownerId,
        req.body
      );

    res.status(201).json({
      success: true,
      data: healthLog,
    });
  } catch (error) {
    next(error);
  }
};

export const getHealthLogsByPet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ownerId = req.user!.user_id;

    const petId = Number(req.params.petId);

    const logs =
      await healthLogService.getHealthLogsByPet(
        ownerId,
        petId
      );

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    next(error);
  }
};

export const getLatestHealthLog = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ownerId = req.user!.user_id;

    const petId = Number(req.params.petId);

    const latest =
      await healthLogService.getLatestHealthLog(
        ownerId,
        petId
      );

    res.json({
      success: true,
      data: latest,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createHealthLog,
  getHealthLogsByPet,
  getLatestHealthLog,
};