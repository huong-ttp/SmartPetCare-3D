import pool from "../config/database.config";
import AppError from "../utils/AppError";
import bcrypt from "bcrypt";

interface ChangePasswordData {
  current_password: string;
  new_password: string;
}
class UserService {
    async updateProfile(
  userId: number,
  data: {
    full_name: string;
    phone?: string;
    address?: string;
  }
) {
  const result = await pool.query(
    `
      UPDATE users
      SET
        full_name = $1,
        phone = $2,
        address = $3
      WHERE user_id = $4
      RETURNING
        user_id,
        full_name,
        email,
        phone,
        address,
        role;
    `,
    [
      data.full_name,
      data.phone ?? null,
      data.address ?? null,
      userId,
    ]
  );

  if (result.rows.length === 0) {
    throw new AppError("Không tìm thấy người dùng", 404);
  }

  return result.rows[0];
}
async changePassword(
  userId: number,
  data: ChangePasswordData
) {
  // Lấy mật khẩu hiện tại trong database
  const result = await pool.query(
    `
      SELECT password_hash
      FROM users
      WHERE user_id = $1
    `,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError("Không tìm thấy người dùng", 404);
  }

  const user = result.rows[0];

  // Kiểm tra mật khẩu cũ
  const isMatch = await bcrypt.compare(
    data.current_password,
    user.password_hash
  );

  if (!isMatch) {
    throw new AppError(
      "Mật khẩu hiện tại không chính xác",
      401
    );
  }

  // Mã hóa mật khẩu mới
  const hashedPassword = await bcrypt.hash(
    data.new_password,
    10
  );

  // Cập nhật mật khẩu
  await pool.query(
    `
      UPDATE users
      SET password_hash = $1
      WHERE user_id = $2
    `,
    [hashedPassword, userId]
  );

  return {
    message: "Mật khẩu đã được thay đổi thành công",
  };
}
}

export default new UserService();