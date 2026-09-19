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

export const listVaccineTypes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const data =
      await vaccineTypeService.listVaccineTypes();

    res.status(200).json({
      success: true,
      data
    });

  } catch (error) {

    next(error);

  }

};

export const createVaccineType = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const data =
      await vaccineTypeService.createVaccineType(
        req.body
      );

    res.status(201).json({

      success: true,

      message:
        "Vaccine type created successfully",

      data

    });

  } catch (error) {

    next(error);

  }

};

export const updateVaccineType = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const vaccineTypeId =
      Number(req.params.id);

    const data =
      await vaccineTypeService.updateVaccineType(
        vaccineTypeId,
        req.body
      );

    res.json({

      success: true,

      message:
        "Vaccine type updated successfully",

      data

    });

  } catch (error) {

    next(error);

  }

};

export const deleteVaccineType = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const vaccineTypeId =
      Number(req.params.id);

    const result =
      await vaccineTypeService.deleteVaccineType(
        vaccineTypeId
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
  getAllVaccineTypes,
  listVaccineTypes,
  createVaccineType,
  updateVaccineType,
  deleteVaccineType
};