import pool from "../config/database.config";
import AppError from "../utils/AppError";
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
    throw new AppError("User not found", 404);
  }

  return result.rows[0];
}
}

export default new UserService();