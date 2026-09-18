import {
  Request,
  Response,
  NextFunction
} from "express";

import vaccineTypeService from "../services/vaccineType.service";

export const getAllVaccineTypes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const vaccineTypes =
      await vaccineTypeService.getAllVaccineTypes();

    res.status(200).json({
      success: true,
      data: vaccineTypes
    });

  } catch (error) {

    next(error);

  }

};

export default {
  getAllVaccineTypes
};