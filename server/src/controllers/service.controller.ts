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

export const listServices = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    const data =
      await serviceService.listServices({
        search: req.query.search as string,
        category: req.query.category as string,
        status: req.query.status as string,
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10
      });

    res.json({
      success: true,
      data
    });

  } catch (error) {
    next(error);
  }
};

export const createService = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const service =
      await serviceService.createService(
        req.body
      );

    res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: service
    });

  } catch (error) {

    next(error);

  }

};

export const updateService = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const service =
      await serviceService.updateService(
        Number(req.params.id),
        req.body
      );

    res.json({

      success: true,

      message: "Service updated successfully",

      data: service

    });

  } catch (error) {

    next(error);

  }

};

export const toggleServiceActive = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const service =
      await serviceService.toggleServiceActive(
        Number(req.params.id)
      );

    res.json({

      success: true,

      message: "Service status updated",

      data: service

    });

  } catch (error) {

    next(error);

  }

};

export const deleteService = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const result =
      await serviceService.deleteService(
        Number(req.params.id)
      );

    res.json({

      success: true,

      message: result.message

    });

  } catch (error) {

    next(error);

  }

};

export default {
  getActiveServices,
  listServices,
  createService,
  updateService,
  toggleServiceActive,
  deleteService
};