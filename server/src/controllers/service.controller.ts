import { Request, Response, NextFunction } from "express";
import serviceService from "../services/service.service";

export const getActiveServices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const services =
      await serviceService.getActiveServices();

    res.json({
      success: true,
      data: services
    });

  } catch (error) {
    next(error);
  }

};

export default {
  getActiveServices
};