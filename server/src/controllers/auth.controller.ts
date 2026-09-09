import { Request, Response, NextFunction } from "express";
import authService from "../services/auth.service";

class AuthController {
  async register(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const result = await authService.register(req.body);

      return res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
  async login(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await authService.login(req.body);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
}

export default new AuthController();