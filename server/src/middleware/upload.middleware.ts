import crypto from "crypto";
import { NextFunction, Request, RequestHandler, Response } from "express";
import multer, { FileFilterCallback, MulterError } from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import type { UploadApiOptions } from "cloudinary";
import cloudinary from "../config/cloudinary.config";
import AppError from "../utils/AppError";

import pool from "../config/database.config";

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

export const MAX_FILE_SIZE_MB = 5;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

const ALLOWED_IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp"];

/** Số file tối đa trong một request (chống spam multipart). */
const MAX_FILES_PER_REQUEST = 5;
/** Số field text tối đa trong một request multipart. */
const MAX_TEXT_FIELDS_PER_REQUEST = 50;
/** Dung lượng tối đa của một field text (1MB) — chặn việc nhét Base64 vào field text. */
const MAX_TEXT_FIELD_SIZE_BYTES = 1 * 1024 * 1024;

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const isAllowedImageMimeType = (
  mimetype: string
): mimetype is AllowedImageMimeType =>
  (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(mimetype);

/**
 * Chuẩn hóa chuỗi (như email, tên tài khoản) để làm tên thư mục an toàn trên Cloudinary.
 * Thay thế tất cả ký tự đặc biệt (@, ., +, khoảng trắng...) bằng dấu gạch dưới.
 * Ví dụ: "milo.owner@gmail.com" -> "milo_owner_gmail_com"
 */
export const sanitizeForCloudinary = (input: string): string =>
  input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "") || "unknown";

/**
 * Xác định tên thư mục riêng cho từng tài khoản người dùng:
 * 1. Nếu là Admin tạo/sửa thú cưng cho khách: lấy email của owner_id từ DB.
 * 2. Nếu người dùng đang đăng nhập: lấy email từ req.user.email hoặc query DB theo user_id.
 * 3. Nếu là form đăng ký (chưa có token): lấy email từ req.body.email.
 * 4. Nếu không xác định được: fallback về user_<user_id> hoặc user_common.
 */
export const resolveAccountIdentifier = async (
  req: Request
): Promise<string> => {
  // 1. Admin thao tác thay cho một chủ nuôi cụ thể (owner_id)
  if (req.user?.role === "admin" && req.body?.owner_id) {
    try {
      const ownerRes = await pool.query(
        "SELECT email FROM users WHERE user_id = $1",
        [req.body.owner_id]
      );
      if (ownerRes.rows.length > 0 && ownerRes.rows[0].email) {
        return `user_${sanitizeForCloudinary(ownerRes.rows[0].email)}`;
      }
    } catch {
      // Bỏ qua lỗi query DB, tiếp tục fallback
    }
    return `user_${req.body.owner_id}`;
  }

  // 2. Người dùng đang đăng nhập (req.user)
  if (req.user?.user_id) {
    if (req.user.email) {
      return `user_${sanitizeForCloudinary(req.user.email)}`;
    }

    try {
      const userRes = await pool.query(
        "SELECT email FROM users WHERE user_id = $1",
        [req.user.user_id]
      );
      if (userRes.rows.length > 0 && userRes.rows[0].email) {
        return `user_${sanitizeForCloudinary(userRes.rows[0].email)}`;
      }
    } catch {
      // Bỏ qua lỗi query DB, tiếp tục fallback
    }
    return `user_${req.user.user_id}`;
  }

  // 3. Form đăng ký tài khoản (chưa có req.user, đọc từ req.body.email)
  if (req.body?.email && typeof req.body.email === "string") {
    return `user_${sanitizeForCloudinary(req.body.email)}`;
  }

  return "user_common";
};

/**
 * Phân loại thư mục con bên trong thư mục tài khoản:
 * - "pets": nếu là ảnh thú cưng (fieldname là petAvatar hoặc route /pets)
 * - "avatar": nếu là ảnh đại diện của người dùng
 * - "misc": các trường hợp khác
 */
export const resolveSubfolderCategory = (
  req: Request,
  file: Express.Multer.File
): "avatar" | "pets" | "misc" => {
  const fieldname = file.fieldname;
  const url = (req.originalUrl || req.baseUrl || "").toLowerCase();

  if (fieldname === "petAvatar" || url.includes("/pets")) {
    return "pets";
  }

  if (fieldname === "avatar" || fieldname === "userAvatar") {
    if (url.includes("/pets")) {
      return "pets";
    }
    return "avatar";
  }

  return "misc";
};

/**
 * Cấu trúc thư mục mới trên Cloudinary:
 * clinic_system/<thư_mục_riêng_từng_tài_khoản>/<avatar|pets|misc>
 *
 * Ví dụ:
 * - Ảnh user: clinic_system/user_nguyenvana_gmail_com/avatar
 * - Ảnh pet:  clinic_system/user_nguyenvana_gmail_com/pets
 *
 * Giúp Admin mở Cloudinary là thấy ngay từng tài khoản có folder riêng,
 * và trong đó pet nào thuộc về user nào rất rõ ràng.
 */
export const resolveUploadFolder = async (
  req: Request,
  file: Express.Multer.File
): Promise<string> => {
  const accountIdentifier = await resolveAccountIdentifier(req);
  const category = resolveSubfolderCategory(req, file);

  return `clinic_system/${accountIdentifier}/${category}`;
};

/**
 * Sinh public_id duy nhất: <loại>_<timestamp>_<random-hex>.
 * Ví dụ: pet_1759690000000_9f2c1a7b3e4d
 */
const generatePublicId = (
  req: Request,
  file: Express.Multer.File
): string => {
  const category = resolveSubfolderCategory(req, file);
  const prefix =
    category === "pets" ? "pet" : category === "avatar" ? "avatar" : "file";
  const timestamp = Date.now();
  const randomSuffix = crypto.randomBytes(6).toString("hex");

  return `${prefix}_${timestamp}_${randomSuffix}`;
};

/* -------------------------------------------------------------------------- */
/*                              Storage & Multer                              */
/* -------------------------------------------------------------------------- */

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (
    req: Request,
    file: Express.Multer.File
  ): Promise<UploadApiOptions> => {
    const folder = await resolveUploadFolder(req, file);
    const public_id = generatePublicId(req, file);

    return {
      folder,
      public_id,
      resource_type: "image",
      allowed_formats: ALLOWED_IMAGE_FORMATS,
      overwrite: false,
      unique_filename: false,
      // Incoming transformation: giới hạn kích thước tối đa + nén tự động
      // ngay khi lưu, giúp giảm dung lượng lưu trữ trên Cloudinary.
      transformation: [
        { width: 1600, height: 1600, crop: "limit" },
        { quality: "auto" },
      ],
    };
  },
});

const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
): void => {
  if (isAllowedImageMimeType(file.mimetype)) {
    callback(null, true);
    return;
  }

  callback(
    new AppError(
      `File "${file.originalname}" có định dạng "${file.mimetype}" không được hỗ trợ. ` +
        `Chỉ chấp nhận ảnh JPEG, JPG, PNG hoặc WEBP.`,
      400
    )
  );
};

const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: MAX_FILES_PER_REQUEST,
    fields: MAX_TEXT_FIELDS_PER_REQUEST,
    fieldSize: MAX_TEXT_FIELD_SIZE_BYTES,
  },
});

/* -------------------------------------------------------------------------- */
/*                               Error handling                               */
/* -------------------------------------------------------------------------- */

const getMulterErrorMessage = (error: MulterError): string => {
  switch (error.code) {
    case "LIMIT_FILE_SIZE":
      return `Ảnh ở trường "${error.field ?? "file"}" vượt quá dung lượng cho phép (tối đa ${MAX_FILE_SIZE_MB}MB).`;
    case "LIMIT_FILE_COUNT":
      return `Số lượng file vượt quá giới hạn (tối đa ${MAX_FILES_PER_REQUEST} file mỗi lần gửi).`;
    case "LIMIT_UNEXPECTED_FILE":
      return `Trường file "${error.field ?? ""}" không hợp lệ hoặc gửi nhiều ảnh hơn số lượng cho phép.`;
    case "LIMIT_PART_COUNT":
      return "Dữ liệu gửi lên có quá nhiều phần (parts).";
    case "LIMIT_FIELD_KEY":
      return "Tên trường dữ liệu quá dài.";
    case "LIMIT_FIELD_VALUE":
      return `Giá trị của trường "${error.field ?? ""}" quá lớn. Vui lòng gửi ảnh dưới dạng file thay vì chuỗi Base64.`;
    case "LIMIT_FIELD_COUNT":
      return "Số lượng trường dữ liệu vượt quá giới hạn.";
    case "MISSING_FIELD_NAME":
      return "Thiếu tên trường (field name) cho file tải lên.";
    default:
      return "Tải ảnh lên thất bại do dữ liệu không hợp lệ.";
  }
};

interface CloudinaryErrorShape {
  message: string;
  http_code: number;
}

const isCloudinaryError = (error: unknown): error is CloudinaryErrorShape =>
  typeof error === "object" &&
  error !== null &&
  "http_code" in error &&
  typeof (error as { http_code: unknown }).http_code === "number" &&
  "message" in error &&
  typeof (error as { message: unknown }).message === "string";

/**
 * Chuẩn hóa mọi lỗi phát sinh trong quá trình upload (Multer, fileFilter,
 * Cloudinary) thành AppError để error.middleware trả về JSON thống nhất.
 */
export const translateUploadError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof MulterError) {
    const statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    return new AppError(getMulterErrorMessage(error), statusCode);
  }

  if (isCloudinaryError(error)) {
    console.error("[Cloudinary] Upload error:", error);

    // Lỗi do định dạng file không hợp lệ (allowed_formats) trả về 400 từ Cloudinary.
    if (error.http_code === 400) {
      return new AppError(
        `Ảnh không hợp lệ: ${error.message}. Chỉ chấp nhận JPEG, JPG, PNG hoặc WEBP.`,
        400
      );
    }

    return new AppError(
      "Dịch vụ lưu trữ ảnh đang gặp sự cố. Vui lòng thử lại sau.",
      502
    );
  }

  if (error instanceof Error) {
    console.error("[Upload] Unexpected error:", error);
    return new AppError(`Tải ảnh lên thất bại: ${error.message}`, 500);
  }

  console.error("[Upload] Unknown error:", error);
  return new AppError("Tải ảnh lên thất bại do lỗi không xác định.", 500);
};

/**
 * Bọc middleware của Multer để bắt lỗi và chuyển thành AppError.
 */
const withUploadErrorHandling =
  (multerMiddleware: RequestHandler): RequestHandler =>
  (req: Request, res: Response, next: NextFunction): void => {
    multerMiddleware(req, res, (error?: unknown) => {
      if (error) {
        next(translateUploadError(error));
        return;
      }

      next();
    });
  };

/* -------------------------------------------------------------------------- */
/*                             Exported middlewares                           */
/* -------------------------------------------------------------------------- */

/**
 * Upload đồng thời avatar người dùng (`avatar`) và avatar thú cưng (`petAvatar`)
 * trong form đăng ký. Cả 2 trường đều không bắt buộc.
 *
 * Lưu ý: Multer chỉ xử lý request `multipart/form-data`. Với request JSON,
 * middleware này sẽ bỏ qua và chuyển tiếp nguyên vẹn (tương thích ngược).
 */
export const uploadRegistrationAvatars: RequestHandler = withUploadErrorHandling(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "petAvatar", maxCount: 1 },
  ])
);

/**
 * Upload 1 ảnh duy nhất theo tên field truyền vào.
 * @example router.put("/profile/avatar", uploadSingleImage("userAvatar"), controller.updateAvatar)
 */
export const uploadSingleImage = (fieldName: string): RequestHandler =>
  withUploadErrorHandling(upload.single(fieldName));

/* -------------------------------------------------------------------------- */
/*                         Helpers for controllers/services                   */
/* -------------------------------------------------------------------------- */

export type UploadedFilesMap = Record<string, Express.Multer.File[]>;

const isUploadedFilesMap = (
  files: Request["files"]
): files is UploadedFilesMap =>
  typeof files === "object" && files !== null && !Array.isArray(files);

/**
 * Lấy file theo tên field, hỗ trợ cả upload.single (req.file),
 * upload.fields (req.files dạng object) và upload.array (req.files dạng mảng).
 */
export const getUploadedFile = (
  req: Request,
  fieldName: string
): Express.Multer.File | undefined => {
  if (req.file && req.file.fieldname === fieldName) {
    return req.file;
  }

  if (isUploadedFilesMap(req.files)) {
    return req.files[fieldName]?.[0];
  }

  if (Array.isArray(req.files)) {
    return req.files.find((file) => file.fieldname === fieldName);
  }

  return undefined;
};

/**
 * Gom toàn bộ file đã upload trong request (phục vụ việc rollback khi lỗi).
 */
export const collectUploadedFiles = (req: Request): Express.Multer.File[] => {
  const files: Express.Multer.File[] = [];

  if (req.file) {
    files.push(req.file);
  }

  if (isUploadedFilesMap(req.files)) {
    Object.values(req.files).forEach((group) => files.push(...group));
  } else if (Array.isArray(req.files)) {
    files.push(...req.files);
  }

  return files;
};

/**
 * Tạo URL phân phối đã tối ưu (f_auto, q_auto) từ public_id.
 * Cloudinary sẽ tự trả về WebP/AVIF tùy trình duyệt và nén chất lượng tối ưu.
 * Với CloudinaryStorage, `file.filename` chính là public_id (đã gồm folder).
 */
export const buildOptimizedImageUrl = (publicId: string): string =>
  cloudinary.url(publicId, {
    secure: true,
    resource_type: "image",
    fetch_format: "auto",
    quality: "auto",
  });

/**
 * Trả về URL tối ưu của file theo tên field, hoặc null nếu không có file.
 */
export const getUploadedImageUrl = (
  req: Request,
  fieldName: string
): string | null => {
  const file = getUploadedFile(req, fieldName);
  if (!file) return null;
  return file.path || buildOptimizedImageUrl(file.filename);
};

/**
 * Xóa các ảnh đã upload lên Cloudinary (dùng khi nghiệp vụ phía sau thất bại,
 * tránh để lại ảnh "mồ côi"). Không bao giờ throw — chỉ log lỗi.
 */
export const deleteUploadedFiles = async (
  files: Express.Multer.File[]
): Promise<void> => {
  if (files.length === 0) {
    return;
  }

  const results = await Promise.allSettled(
    files.map((file) =>
      cloudinary.uploader.destroy(file.filename, {
        resource_type: "image",
        invalidate: true,
      })
    )
  );

  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        `[Cloudinary] Không thể xóa ảnh "${files[index].filename}":`,
        result.reason
      );
    }
  });
};

export default upload;
