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
async refresh(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await authService.refreshToken(
      req.body.refresh_token
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
async me(
  req: Request,
  res: Response
) {
  return res.json({
    success: true,
    data: (req as any).user,
  });
}
async profile(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await authService.getProfile(
      req.user.user_id
    );

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}
async logout(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await authService.logout();

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
async forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await authService.forgotPassword(
      req.body
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result =
      await authService.resetPassword(req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
}

export default new AuthController();