import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError";

const authorize =
  (...roles: string[]) =>
  (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError("Forbidden", 403);
    }

    next();
  };

export default authorize;