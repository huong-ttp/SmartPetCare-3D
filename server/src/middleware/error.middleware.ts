import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError";

const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Handle express PayloadTooLargeError
  if (err.type === "entity.too.large" || err.status === 413) {
    return res.status(413).json({
      success: false,
      message: "Dung lượng dữ liệu quá lớn (tối đa 50MB). Vui lòng chọn ảnh nhỏ hơn.",
    });
  }

  // Handle PostgreSQL Unique Constraint Violation
  if (err.code === "23505") {
    if (err.constraint?.includes("microchip") || err.detail?.includes("microchip_id")) {
      return res.status(400).json({
        success: false,
        message: "Mã Microchip ID này đã được đăng ký cho thú cưng khác.",
      });
    }
    return res.status(400).json({
      success: false,
      message: "Dữ liệu bị trùng lặp trong hệ thống.",
    });
  }

  // Handle PostgreSQL invalid datetime format
  if (err.code === "22007") {
    return res.status(400).json({
      success: false,
      message: "Định dạng ngày tháng không hợp lệ.",
    });
  }

  // Handle custom or standard status/statusCode
  const statusCode = Number(err.statusCode || err.status);
  if (!isNaN(statusCode) && statusCode >= 400 && statusCode < 600) {
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Yêu cầu không hợp lệ.",
    });
  }

  console.error("Unhandled Error:", err);

  const isDev = process.env.NODE_ENV === "development";
  return res.status(500).json({
    success: false,
    message: isDev && err.message ? err.message : "Internal Server Error",
  });
};

export default errorHandler;