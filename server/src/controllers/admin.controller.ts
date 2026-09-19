import { Request, Response, NextFunction } from "express";
import adminService from "../services/admin.service";

export const getDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const dashboard =
      await adminService.getDashboard();

    res.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    next(error);
  }

};

export const listUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const users =
await adminService.listUsers({

    search: req.query.search as string,

    role: req.query.role as string,

    status: req.query.status as string,

    page: Number(req.query.page) || 1,

    limit: Number(req.query.limit) || 10

});

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    next(error);
  }

};

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const user =
      await adminService.createUser(
        req.body
      );

    res.status(201).json({
      success: true,
      data: user
    });

  } catch (error) {
    next(error);
  }

};

export const updateUserRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const adminId =
      req.user!.user_id;

    const userId =
      Number(req.params.id);

    const user =
      await adminService.updateUserRole(
        adminId,
        userId,
        req.body
      );

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    next(error);
  }

};

export const toggleUserActive = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const adminId =
      req.user!.user_id;

    const userId =
      Number(req.params.id);

    const user =
      await adminService.toggleUserActive(
        adminId,
        userId
      );

    res.json({
      success: true,
      data: user
    });

  } catch (error) {
    next(error);
  }

};

export const listPets = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const pets =
      await adminService.listPets({

        search:
          req.query.search as string,

        species:
          req.query.species as string,

        page:
          Number(req.query.page) || 1,

        limit:
          Number(req.query.limit) || 10

      });

    res.json({
      success: true,
      data: pets
    });

  } catch (error) {
    next(error);
  }

};

export const getPetById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const pet =
      await adminService.getPetById(
        Number(req.params.id)
      );

    res.json({

      success: true,

      data: pet

    });

  }

  catch (err) {

    next(err);

  }

};

export const updatePet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const pet =
      await adminService.updatePet(
        Number(req.params.id),
        req.body
      );

    res.json({

      success: true,

      message: "Pet updated successfully",

      data: pet

    });

  } catch (err) {

    next(err);

  }

};

export const deletePet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const result =
      await adminService.deletePet(
        Number(req.params.id)
      );

    res.json({

      success: true,

      message: result.message

    });

  } catch (err) {

    next(err);

  }

};
export default {
  getDashboard,
  listUsers,
  createUser,
  updateUserRole,
  toggleUserActive,
  listPets,
  getPetById,
  updatePet,
  deletePet
};