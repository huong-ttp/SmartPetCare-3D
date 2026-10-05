import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

// Nạp biến môi trường ngay tại đây để module này an toàn kể cả khi được import
// trước khi server.ts gọi dotenv.config() (ví dụ: trong script hoặc test).
dotenv.config();

type CloudinaryEnvKey =
  | "CLOUDINARY_CLOUD_NAME"
  | "CLOUDINARY_API_KEY"
  | "CLOUDINARY_API_SECRET";

const getRequiredEnv = (key: CloudinaryEnvKey): string => {
  const value = process.env[key];

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(
      `[Cloudinary] Thiếu biến môi trường bắt buộc "${key}". ` +
        `Hãy khai báo trong file server/.env (xem server/.env.example).`
    );
  }

  return value.trim();
};

cloudinary.config({
  cloud_name: getRequiredEnv("CLOUDINARY_CLOUD_NAME"),
  api_key: getRequiredEnv("CLOUDINARY_API_KEY"),
  api_secret: getRequiredEnv("CLOUDINARY_API_SECRET"),
  secure: true,
});

export { cloudinary };
export default cloudinary;
