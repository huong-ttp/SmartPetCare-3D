import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import AppError from "../utils/AppError";

const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("Unauthorized", 401);
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new AppError("Unauthorized", 401);
  }

  try {
  const decoded = jwt.verify(
  token,
  process.env.JWT_SECRET!
) as {
  user_id: number;
  role: string;
};

req.user = decoded;

  next();
} catch {
  throw new AppError("Unauthorized", 401);
}
};

export const authorize = (...roles: string[]) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {

    if (!req.user) {
      throw new AppError(
        "Unauthorized",
        401
      );
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(
        "Forbidden",
        403
      );
    }

    next();
  };
};




export default authMiddleware;