import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import {
  collectUploadedFiles,
  deleteUploadedFiles,
} from "./upload.middleware";

const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // Nếu Multer đã upload ảnh lên Cloudinary trước bước validate,
      // xóa ngay để tránh ảnh "mồ côi" khi dữ liệu không hợp lệ.
      void deleteUploadedFiles(collectUploadedFiles(req));

      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });

      return;
    }

    req.body = result.data;

    next();
  };

export default validate;