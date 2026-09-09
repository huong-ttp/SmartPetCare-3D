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
interface LoginData {
  email: string;
  password: string;
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
async login(data: LoginData) {
  const result = await pool.query(
    `
      SELECT *
      FROM users
      WHERE email = $1
    `,
    [data.email]
  );
  if (result.rows.length === 0) {
  throw new AppError(
    "Email hoặc mật khẩu không đúng",
    401
  );
}
const user = result.rows[0];
const isMatch = await bcrypt.compare(
  data.password,
  user.password_hash
);
if (!isMatch) {
  throw new AppError(
    "Email hoặc mật khẩu không đúng",
    401
  );
}
return {
  message: "Login successful",
  user: {
    user_id: user.user_id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role: user.role,
  },
};
}
}
export default new AuthService();
