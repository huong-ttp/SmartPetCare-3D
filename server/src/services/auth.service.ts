import bcrypt from "bcrypt";
import pool from "../config/database.config";
import AppError from "../utils/AppError";
interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}
class AuthService {
  async register(data: RegisterData) {
    const existingUser = await pool.query(
    `
    SELECT user_id
    FROM users
    WHERE email = $1
  `,
  [data.email]
);
 if (existingUser.rows.length > 0) {
    throw new AppError("Email already exists", 409);
}
const hashedPassword = await bcrypt.hash(data.password, 10);
const result = await pool.query(
  `
    INSERT INTO users (
      full_name,
      email,
      password_hash,
      phone,
      address,
      role,
      is_active
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING
      user_id,
      full_name,
      email,
      phone,
      address,
      role,
      is_active,
      created_at;
  `,
  [
    data.full_name,
    data.email,
    hashedPassword,
    data.phone ?? null,
    data.address ?? null,
    "owner",
    true,
  ]
);

return {
  message: "Register successfully",
  user: result.rows[0],
};
}
}
export default new AuthService();
