import { Request, Response, NextFunction } from "express";
import healthLogService from "../services/healthLog.service";

export const createHealthLog = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.user_id;
    const role = req.user!.role;

    const healthLog =
      await healthLogService.createHealthLog(
        userId,
        req.body,
        role
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
    const userId = req.user!.user_id;
    const role = req.user!.role;

    const petId = Number(req.params.petId);

    const logs =
      await healthLogService.getHealthLogsByPet(
        userId,
        petId,
        role
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
    const userId = req.user!.user_id;
    const role = req.user!.role;

    const petId = Number(req.params.petId);

    const latest =
      await healthLogService.getLatestHealthLog(
        userId,
        petId,
        role
      );

    res.json({
      success: true,
      data: latest,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteHealthLog = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user!.user_id;
    const role = req.user!.role;

    const logId = Number(req.params.id);

    const result = await healthLogService.deleteHealthLog(
      userId,
      logId,
      role
    );

    res.json({
      success: true,
      data: result,
      message: "Health log deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createHealthLog,
  getHealthLogsByPet,
  getLatestHealthLog,
  deleteHealthLog,
};