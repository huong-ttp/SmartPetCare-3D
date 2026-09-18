import { Request, Response, NextFunction } from "express";
import userService from "../services/user.service"
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await userService.updateProfile(
      req.user!.user_id,
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

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await userService.changePassword(
      req.user!.user_id,
      req.body
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  try {

    const userId = req.user!.user_id;

    const profile =
      await userService.getProfile(
        userId
      );

    res.json({
      success: true,
      data: profile
    });

  } catch (error) {
    next(error);
  }

};

export default {
    getProfile,
    updateProfile,
    changePassword
};