import { Request, Response, NextFunction } from "express";
import userService from "../services/user.service"
class UserController {
    async updateProfile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await userService.updateProfile(
      req.user.user_id,
      req.body
    );

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}
async changePassword(
    req: Request,
    res: Response,
    next: NextFunction
) {
  try {
    const result = await userService.changePassword(
      req.user.user_id,
      req.body
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
}

export default new UserController();